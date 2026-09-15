import * as admin from 'firebase-admin';
import {randomUUID} from 'crypto';
import {assertVoiceAiAccess, readUserEntitlements} from '../entitlements/entitlements';
import {AgentRun, AgentStep, futureTime, requiresApproval, WRITE_TOOLS} from './policy';
import {claimRun, checkpoint, dataOf, notifyRun, stamp} from './store';
import {nextAction, research, verifyCompletion} from './planner';
import {Observation, readAction, writeAction} from './actions';
import {externalAction, EXTERNAL_TOOLS, ExternalOutcomeUnknown} from '../connections/agent';
import {ownedConnection} from '../connections/service';

export const runnerDependencies = {nextAction, research, verifyCompletion, externalAction};
const boundedResult = (value: string) => Buffer.byteLength(value) <= 16000 ? value : Buffer.from(value).subarray(0, 15900).toString('utf8') + '\n[Observation truncated; do not replace a source using an incomplete read.]';

const record = (run: AgentRun, tool: string, observation: Observation): Partial<AgentRun> => ({
  steps: [...run.steps, {number: run.steps.length + 1, tool, summary: observation.summary.slice(0, 300), result: boundedResult(observation.result), at: new Date().toISOString()} as AgentStep],
  outputs: observation.output ? [...run.outputs.filter(output => output.id !== observation.output!.id), observation.output] : run.outputs,
  pending: null, pending_id: '', approved: false, failures: 0, question: '',
});

export async function runAgent(ref: admin.firestore.DocumentReference): Promise<void> {
  const claimed = await claimRun(ref);
  if (!claimed) return;
  const {lease} = claimed;
  try {
    const user = await admin.auth().getUser(claimed.run.user_id);
    if (user.disabled) throw new Error('Account unavailable');
    const plan = await readUserEntitlements(user.uid, ref.firestore);
    assertVoiceAiAccess(plan);
    // Bound one invocation; the scheduler continues from the persisted checkpoint.
    for (let turn = 0; turn < 2; turn++) {
      let run = dataOf(await ref.get());
      if (!run || run.status !== 'running' || run.lease !== lease) return;
      if (run.steps.length >= run.max_steps || run.calls >= run.max_steps * 2 || run.tokens >= 100000) {
        await checkpoint(ref, lease, (tx, current) => {
          notifyRun(tx, ref, current, 'limit');
          return {status: 'failed', result: 'This run reached its work limit. Review the results and start a narrower goal to continue.', lease: null, lease_until: 0};
        });
        return;
      }
      if (!run.pending) {
        run = await checkpoint(ref, lease, (_tx, current) => ({calls: current.calls + 1})) || undefined;
        if (!run) return;
        const decision = await runnerDependencies.nextAction(run);
        run = await checkpoint(ref, lease, (_tx, current) => ({pending: decision.action, pending_id: randomUUID(), tokens: current.tokens + decision.tokens})) || undefined;
        if (!run) return;
      }
      const action = run.pending!;
      const pendingId = run.pending_id;
      const commit = (change: Parameters<typeof checkpoint>[2]) => checkpoint(ref, lease, change, pendingId);
      const reserveCall = () => commit((_tx, current) => {
        if (current.calls >= current.max_steps * 2 || current.tokens >= 100000) throw new Error('Model work limit reached');
        return {calls: current.calls + 1};
      });
      if (requiresApproval(action, run) && !run.approved) {
        let preview = '';
        if (action.tool === 'call_external_tool') {
          const connection = await ownedConnection(ref.firestore, run.user_id, action.args.connection_id).catch(() => null);
          preview = connection ? `in ${connection.name} (${connection.account}) — ${action.args.tool_name}` : 'in a disconnected application';
        }
        if (action.tool === 'delete_note' || action.tool === 'update_note') {
          const entry = await ref.firestore.collection('entries').doc(String(action.args.id)).get();
          if (entry.data()?.user_id === run.user_id) preview = `“${String(entry.data()?.title || 'Untitled').slice(0, 200)}”`;
        }
        await commit((tx, current) => {
          notifyRun(tx, ref, current, 'approval');
          return {status: 'waiting', question: `Review ${action.tool.replace(/_/g, ' ')} ${preview} before Nova continues.`, lease: null, lease_until: 0};
        });
        return;
      }
      try {
        if (EXTERNAL_TOOLS.has(action.tool)) {
          const observation = await runnerDependencies.externalAction(ref, lease, run, action);
          await commit((_tx, current) => record(current, action.tool, observation));
        } else if (WRITE_TOOLS.has(action.tool)) {
          await commit(async (tx, current) => record(current, action.tool, await writeAction(tx, ref, current, action, plan)));
        } else if (action.tool === 'plan') {
          await commit((_tx, current) => ({...record(current, 'plan', {summary: 'Updated the plan', result: JSON.stringify(action.args.steps)}), plan: action.args.steps as string[]}));
        } else if (action.tool === 'ask_user' || action.tool === 'wait_until' || action.tool === 'finish') {
          if (action.tool === 'finish') {
            if (!await reserveCall()) return;
            const verdict = await runnerDependencies.verifyCompletion(run, action);
            if (!await commit((_tx, current) => ({tokens: current.tokens + verdict.tokens}))) return;
            if (!verdict.complete) {
              await commit((_tx, current) => record(current, 'verification', {summary: 'Completion check found remaining work', result: verdict.feedback}));
              continue;
            }
          }
          const due = action.tool === 'wait_until' ? futureTime(action.args.when, Date.now(), 7) : Date.now();
          await commit((tx, current) => {
            if (action.tool !== 'wait_until') notifyRun(tx, ref, current, action.tool === 'finish' ? 'completed' : 'question');
            const summary = String(action.args.question || action.args.reason || 'Completed the goal');
            return {...record(current, action.tool, {summary, result: JSON.stringify(action.args)}),
              status: action.tool === 'finish' ? 'completed' : action.tool === 'ask_user' ? 'waiting' : 'queued',
              result: action.tool === 'finish' ? String(action.args.result) : current.result,
              question: action.tool === 'ask_user' ? String(action.args.question) : '', lease: null, lease_until: 0, next_run_at: stamp(due)};
          });
          return;
        } else {
          let observation: Observation;
          let sources = run.sources;
          let tokens = 0;
          if (action.tool === 'web_research') {
            if (!run.allow_web) throw new Error('Web research is disabled for this run');
            if (!await reserveCall()) return;
            const found = await runnerDependencies.research(String(action.args.query));
            observation = {summary: `Researched: ${action.args.query}`, result: found.text};
            sources = [...run.sources, ...found.sources].filter((item, index, all) => all.findIndex(s => s.url === item.url) === index).slice(-20);
            tokens = found.tokens;
          } else observation = await readAction(ref.firestore, run, action);
          await commit((_tx, current) => ({...record(current, action.tool, observation), sources, tokens: current.tokens + tokens}));
        }
      } catch (error) {
        if (error instanceof ExternalOutcomeUnknown) {
          await commit((tx, current) => {
            notifyRun(tx, ref, current, 'question');
            return {...record(current, action.tool, {summary: 'Check the external action’s outcome', result: JSON.stringify({success: false, uncertain: true, error: error.message})}),
              status: 'waiting', question: error.message, lease: null, lease_until: 0};
          });
          return;
        }
        // Tool failures become observations so Nova can recover without claiming success.
        await commit((_tx, current) => record(current, action.tool, {summary: `Could not ${action.tool.replace(/_/g, ' ')}`,
          result: JSON.stringify({success: false, error: ['web_research', 'finish'].includes(action.tool) ? 'The provider could not complete this action. Try again or ask the user.' : error instanceof Error ? error.message.slice(0, 400) : 'Action failed'})}));
      }
    }
    await checkpoint(ref, lease, () => ({status: 'queued', lease: null, lease_until: 0, next_run_at: stamp()}));
  } catch {
    await checkpoint(ref, lease, (tx, current) => {
      const failures = current.failures + 1;
      if (failures >= 3) notifyRun(tx, ref, current, 'failed');
      return {failures, status: failures >= 3 ? 'failed' : 'queued', lease: null, lease_until: 0,
        next_run_at: stamp(Date.now() + failures * 60000), result: failures >= 3 ? 'Nova could not continue after three attempts. Your completed steps are preserved.' : current.result};
    });
  }
}
