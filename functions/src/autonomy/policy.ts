export type RunStatus = 'queued' | 'running' | 'paused' | 'waiting' | 'completed' | 'failed' | 'cancelled';
export interface AgentAction {tool: string; args: Record<string, unknown>}
export interface AgentStep {number: number; tool: string; summary: string; result: string; at: string}
export interface AgentRun {
  user_id: string;
  timezone: string;
  goal: string;
  status: RunStatus;
  write_mode: 'auto' | 'review';
  allow_web: boolean;
  max_steps: number;
  steps: AgentStep[];
  calls: number;
  tokens: number;
  failures: number;
  plan: string[];
  notes: string[];
  result: string;
  question: string;
  pending: AgentAction | null;
  pending_id: string;
  approved: boolean;
  lease: string | null;
  lease_until: number;
  sources: {title: string; url: string}[];
  outputs: {id: string; title: string}[];
  next_run_at: unknown;
  created_at: unknown;
  updated_at: unknown;
}

const string = (description: string) => ({type: 'string', description});
export const AGENT_TOOLS = [
  {name: 'plan', description: 'Set or revise a short action plan before working.', properties: {steps: {type: 'array', items: {type: 'string'}}}},
  {name: 'search_entries', description: 'Search the most recent 500 saved entries. Empty query lists recent entries. Results include ids; use read_entry for the full record.', properties: {query: string('Search words, or empty string')}},
  {name: 'read_entry', description: 'Read one saved entry owned by this user. Always read before updating or deleting it.', properties: {id: string('An exact id returned by a tool')}},
  {name: 'list_tasks', description: 'Read current tasks and reminders.', properties: {}},
  {name: 'web_research', description: 'Research a public question on the web and return cited findings. Use only when web access is enabled. Never include private vault content or credentials in a search.', properties: {query: string('A public research question, without private user data')}},
  {name: 'save_note', description: 'Save a new note, document draft, report, or plan. Do not repeat a successful save; keep its returned id.', properties: {title: string('Title'), content: string('Complete plain text or Markdown'), category: string('Category such as Documents, Work, or Personal')}},
  {name: 'update_note', description: 'Update the title and content of a note you have read. Preserves all other fields. Pass the revision returned by read_entry to avoid overwriting later edits.', properties: {id: string('Exact entry id'), revision: string('Revision from read_entry'), title: string('New title'), content: string('Complete replacement content')}},
  {name: 'delete_note', description: 'Delete an explicitly selected note. Requires user approval regardless of run mode. Read the note first.', properties: {id: string('Exact entry id'), revision: string('Revision from read_entry')}},
  {name: 'set_reminder', description: 'Schedule a reminder through the existing phone/email preference system.', properties: {text: string('Reminder text'), when: string('An absolute ISO-8601 timestamp with timezone')}},
  {name: 'wait_until', description: 'Checkpoint and resume at a future time, up to seven days away. Use for requested follow-ups. Step limits still apply.', properties: {when: string('Absolute ISO-8601 timestamp with timezone'), reason: string('Why this run should resume then')}},
  {name: 'ask_user', description: 'Pause for essential missing information or a capability that is not connected. Clearly state what is needed.', properties: {question: string('One concise question or explanation of the missing connection')}},
  {name: 'finish', description: 'Complete only after checking actual tool results against the goal. Include findings, output references, and any limitations. Never claim actions that tools did not perform.', properties: {result: string('Final answer with concrete results and source links'), evidence: string('How the results satisfy the goal; identify any limitations')}},
] as const;

export const WRITE_TOOLS = new Set(['save_note', 'update_note', 'delete_note', 'set_reminder']);
export function requiresApproval(action: AgentAction, run: Pick<AgentRun, 'write_mode'>): boolean {
  return action.tool === 'delete_note' || (run.write_mode === 'review' && WRITE_TOOLS.has(action.tool));
}

export function validateAction(value: unknown): AgentAction {
  if (!value || typeof value !== 'object') throw new Error('Nova did not return a valid action');
  const {tool, args} = value as AgentAction;
  const definition = AGENT_TOOLS.find(item => item.name === tool);
  if (!definition || !args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Unsupported agent action');
  if (Object.keys(args).some(key => !(key in definition.properties))) throw new Error('Unexpected action arguments');
  for (const key of Object.keys(definition.properties)) {
    if (key === 'steps') {
      if (!Array.isArray(args.steps) || !args.steps.length || args.steps.length > 8 || args.steps.some(s => typeof s !== 'string' || s.length > 300)) throw new Error('Invalid plan');
    } else if (typeof args[key] !== 'string' || (key !== 'query' && !(args[key] as string).trim()) || (args[key] as string).length > (key === 'content' || key === 'result' ? 16000 : 2000)) {
      throw new Error(`Invalid ${key}`);
    }
  }
  if ('id' in args && !/^[A-Za-z0-9_-]{1,128}$/.test(String(args.id))) throw new Error('Invalid entry id');
  if ('title' in args && String(args.title).length > 300) throw new Error('Title must be at most 300 characters');
  return {tool, args};
}

export function futureTime(value: unknown, now: number, maxDays = 365): number {
  if (typeof value !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(value)) throw new Error('Use an ISO timestamp with a timezone');
  const time = Date.parse(value);
  if (!Number.isFinite(time) || time <= now || time > now + maxDays * 86400000) throw new Error(`Time must be in the next ${maxDays} days`);
  return time;
}

export function isActive(run: AgentRun, lease: string, now: number): boolean {
  return run.status === 'running' && run.lease === lease && run.lease_until > now;
}

export function newRun(uid: string, goal: string, options: {writeMode?: unknown; allowWeb?: unknown; maxSteps?: unknown; timezone?: unknown}, now: unknown): AgentRun {
  if (!goal.trim() || goal.length > 4000) throw new Error('Describe a goal in 1–4000 characters');
  const maxSteps = options.maxSteps ?? 16;
  if (!Number.isInteger(maxSteps) || Number(maxSteps) < 4 || Number(maxSteps) > 30) throw new Error('Choose between 4 and 30 steps');
  if (options.writeMode !== undefined && !['auto', 'review'].includes(String(options.writeMode))) throw new Error('Invalid write mode');
  let timezone = 'UTC';
  if (typeof options.timezone === 'string' && options.timezone.length <= 80) {
    try {timezone = new Intl.DateTimeFormat('en', {timeZone: options.timezone}).resolvedOptions().timeZone;} catch { /* Default to UTC; the agent must clarify ambiguous dates. */ }
  }
  return {user_id: uid, timezone, goal: goal.trim(), status: 'queued', write_mode: options.writeMode === 'auto' ? 'auto' : 'review',
    allow_web: options.allowWeb === true, max_steps: Number(maxSteps), steps: [], calls: 0, tokens: 0, failures: 0, plan: [], notes: [],
    result: '', question: '', pending: null, pending_id: '', approved: false, lease: null, lease_until: 0, sources: [], outputs: [],
    next_run_at: now, created_at: now, updated_at: now};
}
