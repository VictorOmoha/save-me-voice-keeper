import * as admin from 'firebase-admin';
import {AgentAction, AgentRun} from '../autonomy/policy';
import {checkpoint, stamp} from '../autonomy/store';
import {Observation} from '../autonomy/actions';
import {Connection, ConnectionError, digest, objectArgs} from './types';
import {listConnections, ownedConnection} from './service';
import {prepareGoogle} from './google';
import {openMcp} from './mcp';

export class ExternalOutcomeUnknown extends ConnectionError {}
export const externalDependencies = {prepareGoogle, openMcp};
export const EXTERNAL_TOOLS = new Set(['list_connections', 'list_external_tools', 'read_external_tool', 'call_external_tool']);
const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(',')}}`;
  return JSON.stringify(value);
};
export const isExternalRead = (connection: Pick<Connection, 'provider'>, name: string) => connection.provider === 'google_calendar' && name === 'list_events' || connection.provider === 'google_drive' && ['search_files', 'read_file'].includes(name);
export function assertConnectionAction(run: AgentRun, action: AgentAction, connection: Connection) {
  if (!(run.connection_ids || []).includes(String(action.args.connection_id)) || connection.user_id !== run.user_id) throw new ConnectionError('This application was not enabled for this goal');
  if (connection.revision !== action.args.connection_revision) throw new ConnectionError('The connection changed. List its tools again and request fresh approval.');
  if (!connection.enabled_tools.includes(String(action.args.tool_name))) throw new ConnectionError('This tool is disabled. Enable it in Settings → Connections.');
  if (action.tool === 'read_external_tool' && !isExternalRead(connection, String(action.args.tool_name))) throw new ConnectionError('This external action requires call_external_tool and user approval');
  if (action.tool === 'call_external_tool' && !run.approved) throw new ConnectionError('External actions require approval');
}
export async function externalAction(ref: admin.firestore.DocumentReference, lease: string, run: AgentRun, action: AgentAction): Promise<Observation> {
  const db = ref.firestore;
  const allowed = run.connection_ids || [];
  if (action.tool === 'list_connections') {
    const connections = (await listConnections(db, run.user_id)).filter(item => allowed.includes(item.id));
    return {summary: 'Checked connected applications', result: JSON.stringify({connections: connections.map(item => ({id: item.id, name: item.name, account: item.account, provider: item.provider, revision: item.revision, enabled_tools: item.enabled_tools})),
      settings: '/settings?tab=connections', note: 'Only applications enabled for this goal are shown.'})};
  }
  const id = String(action.args.connection_id);
  if (!allowed.includes(id)) throw new ConnectionError('This application was not enabled for this goal');
  const connection = await ownedConnection(db, run.user_id, id);
  if (action.tool === 'list_external_tools') {
    const tools = connection.tools.filter(tool => connection.enabled_tools.includes(tool.name));
    const selected = tools.find(tool => tool.name === action.args.tool_name);
    if (action.args.tool_name && !selected) throw new ConnectionError('This tool is disabled or unavailable');
    return {summary: `Checked ${connection.name} tools`, result: JSON.stringify({connection_id: id, connection_revision: connection.revision,
      ...(selected ? {tool: {...selected, invoke_with: isExternalRead(connection, selected.name) ? 'read_external_tool' : 'call_external_tool'}} :
        {tools: tools.map(tool => ({name: tool.name, description: tool.description, invoke_with: isExternalRead(connection, tool.name) ? 'read_external_tool' : 'call_external_tool'}))})})};
  }
  assertConnectionAction(run, action, connection);
  let args: Record<string, unknown>;
  try {args = objectArgs(JSON.parse(String(action.args.arguments_json)));} catch {throw new ConnectionError('Tool arguments must contain a valid JSON object');}
  const name = String(action.args.tool_name);
  const effectId = digest(canonical({run: ref.id, connection: id, revision: connection.revision, name, args}));
  const effectRef = db.collection('nova_external_actions').doc(effectId);
  const mutating = action.tool === 'call_external_tool';
  if (mutating) {
    const existing = (await effectRef.get()).data();
    if (existing?.status === 'done') return existing.observation as Observation;
    if (existing) throw new ExternalOutcomeUnknown('A previous attempt may have reached the external application. Check it before continuing; Nova will not repeat this action automatically.');
  }
  let close: (() => Promise<void>) | undefined;
  let execute: () => Promise<unknown>;
  if (connection.provider === 'mcp') {
    const session = await externalDependencies.openMcp(connection.endpoint!, connection.credentials_secret.bearer_token);
    close = session.close;
    execute = () => session.call(name, args);
  } else execute = await externalDependencies.prepareGoogle(connection, name, args, effectId);
  let dispatched = false;
  try {
    // Fence immediately before dispatch. Remote effects cannot be committed in
    // Firestore's transaction, so record their intent before sending the request.
    const current = await checkpoint(ref, lease, async (tx, latest) => {
      const connected = (await tx.get(db.collection('nova_connections').doc(id))).data() as Connection | undefined;
      if (!connected) throw new ConnectionError('This application was disconnected');
      assertConnectionAction(latest, action, connected);
      if (mutating) {
        if ((await tx.get(effectRef)).exists) throw new ExternalOutcomeUnknown('This external action is already recorded. Check its outcome before continuing.');
        tx.create(effectRef, {user_id: run.user_id, run_id: ref.id, connection_id: id, tool_name: name, pending_id: run.pending_id, status: 'dispatching', created_at: stamp()});
      }
      return {};
    }, run.pending_id);
    if (!current) throw new ConnectionError('The goal was paused or cancelled before this action started');
    dispatched = true;
    const result = await execute();
    let serialized = JSON.stringify(result);
    for (const secret of Object.values(connection.credentials_secret)) if (secret) serialized = serialized.split(secret).join('[redacted]');
    const observation = {summary: `${connection.name}: ${name.replace(/_/g, ' ')}`, result: serialized.length > 14000 ? serialized.slice(0, 13900) + '\n[External result truncated; do not assume a complete read.]' : serialized};
    // Keep the provider result even when the user paused during an in-flight
    // request. The next worker can reuse it without repeating the remote effect.
    if (mutating) await effectRef.update({status: 'done', observation, completed_at: stamp()});
    return observation;
  } catch (error) {
    if (mutating && dispatched) {
      await effectRef.update({status: 'uncertain', updated_at: stamp()}).catch(() => {});
      throw new ExternalOutcomeUnknown('The external action was sent, but its outcome could not be confirmed. Check the connected application before continuing. Nova will not repeat this action automatically.');
    }
    throw error;
  } finally {await close?.();}
}
