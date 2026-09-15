import {FormEvent, useEffect, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {collection, doc, limit, onSnapshot, orderBy, query, where} from 'firebase/firestore';
import {ArrowUpRight, CheckCircle2, Loader2, Pause, Play, Sparkles, Square} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import {db} from '@/lib/firebase';
import {Button} from '@/components/ui/button';
import {WorkspacePage, WorkspacePageHeader} from '@/components/workspace/WorkspacePage';
import {ended, goalRequest, goalStatus, NovaGoal} from '@/services/novaGoals';

const examples = [
  {label: 'Plan my week', goal: 'Review my recent saved notes, tasks, and reminders. Save a realistic plan for my week, with priorities and anything you need me to clarify.'},
  {label: 'Research a topic', goal: 'Research practical ways to improve focus at work. Compare three approaches with sources and save a concise plan I can try this week.'},
  {label: 'Prepare a briefing', goal: 'Review my recent work notes. Save a briefing covering progress, open questions, and suggested next steps.'},
];
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';

export function GoalDetail({run, busy, onAction}: {run: NovaGoal; busy: boolean; onAction: (operation: string, extra?: Record<string, unknown>) => Promise<void>}) {
  const [answer, setAnswer] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const scheduled = run.status === 'queued' && run.next_run_at && run.next_run_at.toMillis() > Date.now() + 60000;
  const waitingForApproval = run.status === 'waiting' && run.pending;
  return <section aria-label="Goal progress" className="min-w-0 rounded-2xl border bg-card p-5 md:p-7">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span role="status" className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${run.status === 'waiting' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-primary/10 text-primary'}`}>
        {run.status === 'running' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : run.status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}{goalStatus[run.status]}
      </span>
      <span className="text-xs text-muted-foreground">{run.steps.length} of {run.max_steps} steps</span>
    </div>
    <h2 className="mt-4 whitespace-pre-wrap break-words text-lg font-semibold">{run.goal}</h2>
    <p className="mt-2 text-xs text-muted-foreground">{run.write_mode === 'auto' ? 'Saves and reminders run automatically' : 'Review saves and reminders'} · Web research {run.allow_web ? 'on' : 'off'}</p>
    {scheduled && <p className="mt-3 text-sm text-muted-foreground">Continues after {run.next_run_at!.toDate().toLocaleString()}.</p>}
    {!ended(run) && <div className="mt-4 flex flex-wrap gap-2">
      {['queued', 'running'].includes(run.status) && <Button variant="outline" size="sm" disabled={busy} onClick={() => onAction('pause')}><Pause className="mr-2 h-3.5 w-3.5" />Pause</Button>}
      {run.status === 'paused' && <Button size="sm" disabled={busy} onClick={() => onAction('resume')}><Play className="mr-2 h-3.5 w-3.5" />Resume</Button>}
      {confirmCancel ? <><Button variant="destructive" size="sm" disabled={busy} onClick={() => onAction('cancel')}>Cancel this goal</Button><Button variant="ghost" size="sm" onClick={() => setConfirmCancel(false)}>Keep working</Button><p className="basis-full text-xs text-muted-foreground">Completed changes will be kept.</p></> : <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmCancel(true)}><Square className="mr-2 h-3.5 w-3.5" />Cancel</Button>}
    </div>}
    {run.status === 'waiting' && <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <h3 className="font-semibold">Nova needs your input</h3><p className="mt-2 whitespace-pre-wrap text-sm">{run.question}</p>
      {waitingForApproval ? <>
        <dl className="mt-4 space-y-3 text-sm">{Object.entries(run.pending!.args).map(([name, value]) => <div key={name}><dt className="font-semibold capitalize">{name.replace(/_/g, ' ')}</dt><dd className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap break-words text-muted-foreground">{typeof value === 'string' ? value : JSON.stringify(value)}</dd></div>)}</dl>
        <div className="mt-4 flex gap-2"><Button disabled={busy} onClick={() => onAction('approve', {pendingId: run.pending_id})}>Approve change</Button><Button variant="outline" disabled={busy} onClick={() => onAction('reject', {pendingId: run.pending_id})}>Reject</Button></div>
      </> : <form className="mt-3" onSubmit={async event => {event.preventDefault(); try {await onAction('reply', {answer, expectedSteps: run.steps.length}); setAnswer('');} catch { /* The workspace shows the error and preserves this reply. */ }}}>
        <label htmlFor="goal-reply" className="sr-only">Your reply</label><textarea id="goal-reply" required maxLength={4000} value={answer} onChange={event => setAnswer(event.target.value)} className="min-h-24 w-full rounded-lg border bg-background p-3 text-sm" />
        <Button type="submit" className="mt-2" disabled={busy || !answer.trim()}>Reply and continue</Button>
      </form>}
    </div>}
    {run.plan.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold">Plan</h3><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">{run.plan.map((step, i) => <li key={i}>{step}</li>)}</ol></div>}
    {run.result && <div className="mt-6 rounded-xl bg-muted/50 p-4"><h3 className="mb-3 font-semibold">{run.status === 'completed' ? 'Result' : 'Run summary'}</h3><div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{run.result}</div></div>}
    {run.outputs.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold">Saved work</h3><ul className="mt-2 space-y-2">{run.outputs.map(output => <li key={output.id}><Link className="inline-flex items-center gap-2 break-words text-sm text-primary underline-offset-4 hover:underline" to={`/all-entries/${encodeURIComponent(output.id)}`}>{output.title}<ArrowUpRight className="h-4 w-4 shrink-0" /></Link></li>)}</ul></div>}
    {run.sources.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold">Sources</h3><ul className="mt-2 space-y-2">{run.sources.filter(source => /^https?:\/\//.test(source.url)).map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="break-words text-sm text-primary hover:underline">{source.title || source.url}</a></li>)}</ul></div>}
    <div className="mt-6 border-t pt-5"><h3 className="text-sm font-semibold">Activity</h3>{run.steps.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Nova will begin shortly. You can leave this page while it works.</p>}
      <ol className="mt-3 space-y-3">{run.steps.map(step => <li key={step.number}><details className="rounded-lg border p-3"><summary className="cursor-pointer text-sm"><span className="mr-2 text-muted-foreground">{step.number}.</span>{step.summary}</summary><pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">{step.result}</pre></details></li>)}</ol>
    </div>
  </section>;
}

function GoalWorkspace() {
  const {user} = useAuth();
  const [params, setParams] = useSearchParams();
  const [runs, setRuns] = useState<NovaGoal[]>([]);
  const [linkedRun, setLinkedRun] = useState<NovaGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [goal, setGoal] = useState('');
  const [writeMode, setWriteMode] = useState('auto');
  const [allowWeb, setAllowWeb] = useState(false);
  const [busy, setBusy] = useState(false);
  const request = useRef({key: '', id: ''});
  const selectedId = params.get('run') || '';
  useEffect(() => {
    if (!user) return;
    let active = true;
    goalRequest<{available: boolean}>(user, {operation: 'status'}).then(data => {if (active) setAvailable(data.available);}).catch(e => {if (active) setError(errorText(e));});
    const unsubscribe = onSnapshot(query(collection(db, 'nova_agent_runs'), where('user_id', '==', user.uid), orderBy('created_at', 'desc'), limit(30)), snapshot => {
      setRuns(snapshot.docs.map(item => ({...item.data(), id: item.id}) as NovaGoal)); setLoading(false);
    }, () => {setLoading(false); setError('Could not load your goals. Please reload to reconnect.');});
    return () => {active = false; unsubscribe();};
  }, [user]);
  useEffect(() => {
    setLinkedRun(null);
    if (!user || !/^[a-f0-9]{64}$/.test(selectedId)) return;
    return onSnapshot(doc(db, 'nova_agent_runs', selectedId), snapshot => {
      if (snapshot.exists() && snapshot.data().user_id === user.uid) setLinkedRun({...snapshot.data(), id: snapshot.id} as NovaGoal);
      else setError('This goal is unavailable.');
    }, () => setError('This goal is unavailable.'));
  }, [user, selectedId]);
  const selected = selectedId ? runs.find(run => run.id === selectedId) || linkedRun : runs[0];
  const openCount = runs.filter(run => !ended(run)).length;
  async function start(event: FormEvent) {
    event.preventDefault(); if (!user || busy) return;
    const key = JSON.stringify({goal: goal.trim(), writeMode, allowWeb});
    if (request.current.key !== key) request.current = {key, id: crypto.randomUUID()};
    setBusy(true); setError('');
    try {
      const result = await goalRequest<{runId: string}>(user, {operation: 'create', goal: goal.trim(), writeMode, allowWeb, maxSteps: 16, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, requestId: request.current.id});
      setParams({run: result.runId}); setGoal(''); request.current = {key: '', id: ''};
    } catch (e) {setError(errorText(e));} finally {setBusy(false);}
  }
  async function control(operation: string, extra: Record<string, unknown> = {}) {
    if (!user || !selected || busy) return;
    setBusy(true); setError('');
    try {await goalRequest(user, {operation, runId: selected.id, ...extra});}
    catch (e) {setError(errorText(e)); throw e;}
    finally {setBusy(false);}
  }
  // Button actions report errors above; reply forms also keep unsent text on failure.
  const action = (operation: string, extra?: Record<string, unknown>) => operation === 'reply' ? control(operation, extra) : control(operation, extra).catch(() => {});
  return <>
    <WorkspacePageHeader eyebrow="Nova agent" title="Give Nova a goal" description="Research, plan, and work with your saved information. Nova keeps working in the background and checks its results before finishing." />
    {error && <div role="alert" className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">{error}</div>}
    {available === false && <p role="status" className="mb-5 rounded-xl border p-4 text-sm">Background goals are not configured yet. Please try again later.</p>}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-6">
        <form onSubmit={start} className="rounded-2xl border bg-card p-5">
          <label htmlFor="nova-goal" className="font-semibold">What would you like done?</label>
          <textarea id="nova-goal" value={goal} onChange={event => setGoal(event.target.value)} required maxLength={4000} placeholder="Describe the outcome, relevant notes, and any deadline…" className="mt-3 min-h-36 w-full rounded-xl border bg-background p-3 text-sm leading-relaxed" />
          <div className="mt-3 flex flex-wrap gap-2">{examples.map(example => <button type="button" key={example.label} className="rounded-full border px-3 py-2 text-xs hover:bg-muted" onClick={() => {setGoal(example.goal); setAllowWeb(example.label === 'Research a topic');}}>{example.label}</button>)}</div>
          <label htmlFor="goal-mode" className="mt-5 block text-sm font-medium">Changes to your workspace</label>
          <select id="goal-mode" value={writeMode} onChange={event => setWriteMode(event.target.value)} className="mt-2 w-full rounded-lg border bg-background p-2.5 text-sm"><option value="auto">Save notes and reminders automatically</option><option value="review">Review each change first</option></select>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Deleting an entry always needs your approval.</p>
          <label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={allowWeb} onChange={event => setAllowWeb(event.target.checked)} className="h-4 w-4 accent-primary" />Allow public web research</label>
          <Button type="submit" className="mt-5 w-full" disabled={busy || available !== true || !goal.trim() || openCount >= 3}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Start goal</Button>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Up to 16 steps per goal and 3 open goals. Work continues after you close the app.</p>
          {openCount >= 3 && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Finish or cancel an open goal to start another.</p>}
        </form>
        <section aria-label="Your goals"><h2 className="mb-3 text-sm font-semibold">Your goals</h2>{loading ? <p className="text-sm text-muted-foreground">Loading goals…</p> : runs.length === 0 ? <p className="text-sm text-muted-foreground">Your first goal will appear here.</p> : <ul className="space-y-2">{runs.map(run => <li key={run.id}><button type="button" aria-pressed={selected?.id === run.id} onClick={() => setParams({run: run.id})} className={`w-full rounded-xl border p-4 text-left hover:bg-muted/50 ${selected?.id === run.id ? 'border-primary/50 bg-primary/5' : 'bg-card'}`}><span className="block line-clamp-2 break-words text-sm font-medium">{run.goal}</span><span className="mt-2 block text-xs text-muted-foreground">{goalStatus[run.status]} · {run.steps.length} steps</span></button></li>)}</ul>}</section>
        <p className="text-xs leading-relaxed text-muted-foreground">Completion and questions appear in your inbox. Phone and email updates use your <Link to="/settings?tab=notifications" className="text-primary underline">notification preferences</Link>. External accounts and computer control are not connected yet.</p>
      </div>
      {selected ? <GoalDetail key={selected.id} run={selected} busy={busy} onAction={action} /> : <div className="rounded-2xl border border-dashed p-8 md:p-12"><Sparkles className="h-8 w-8 text-primary" /><h2 className="mt-5 text-xl font-semibold">From a request to a finished result</h2><p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">Give Nova a clear outcome. It makes a plan, uses the available tools, and checks its work. You can follow each step here, or come back when it is ready.</p><ol className="mt-6 space-y-4 text-sm"><li><strong>1. Describe the outcome</strong><p className="mt-1 text-muted-foreground">Include the topic, saved information to use, and what to produce.</p></li><li><strong>2. Nova works through it</strong><p className="mt-1 text-muted-foreground">Research, organize, draft, and schedule follow-ups.</p></li><li><strong>3. Review the result</strong><p className="mt-1 text-muted-foreground">Find the answer, sources, and saved work in one place.</p></li></ol></div>}
    </div>
  </>;
}

export default function NovaGoals() {
  const {user} = useAuth();
  return <WorkspacePage><GoalWorkspace key={user?.uid || 'signed-out'} /></WorkspacePage>;
}
