import * as admin from 'firebase-admin';
import {assertEntryAdmission, PlanEntitlements} from '../entitlements/entitlements';
import {AgentAction, AgentRun, futureTime} from './policy';
import {stamp} from './store';

const text = (value: unknown) => JSON.stringify(value, (_key, item) => item === undefined ? null : item).slice(0, 14000);
const revision = (time: admin.firestore.Timestamp) => `${time.seconds}.${time.nanoseconds}`;
export interface Observation {summary: string; result: string; output?: {id: string; title: string}}

export async function readAction(db: admin.firestore.Firestore, run: AgentRun, action: AgentAction): Promise<Observation> {
  const {tool, args} = action;
  if (tool === 'read_entry') {
    const snap = await db.collection('entries').doc(String(args.id)).get();
    if (!snap.exists || snap.data()?.user_id !== run.user_id) throw new Error('Entry not found');
    return {summary: `Read ${snap.data()?.title || 'entry'}`, result: text({id: snap.id, revision: revision(snap.updateTime!), record: snap.data()})};
  }
  if (tool === 'search_entries') {
    const snap = await db.collection('entries').where('user_id', '==', run.user_id).orderBy('updated_at', 'desc').limit(500).get();
    const words = String(args.query).toLowerCase().split(/\s+/).filter(Boolean);
    const matches = snap.docs.filter(doc => words.every(word => text(doc.data()).toLowerCase().includes(word)));
    const entries = matches.slice(0, 12).map(doc => ({id: doc.id, title: doc.data().title || 'Untitled',
      category: doc.data().category || doc.data().fields?.category || '', preview: text(doc.data().fields || {}).slice(0, 800)}));
    return {summary: `Found ${matches.length} matching entries`, result: text({entries, returned: entries.length, searchWindow: 'Most recent 500 entries'})};
  }
  if (tool === 'list_tasks') {
    const [tasks, reminders] = await Promise.all(['action_items', 'reminders'].map(collection => db.collection(collection).where('user_id', '==', run.user_id).limit(50).get()));
    return {summary: 'Checked tasks and reminders', result: text({tasks: tasks.docs.map(d => ({id: d.id, ...d.data()})), reminders: reminders.docs.map(d => ({id: d.id, ...d.data()}))})};
  }
  throw new Error('This tool is not available');
}

/** All writes and their completion record commit in one Firestore transaction. */
export async function writeAction(tx: admin.firestore.Transaction, ref: admin.firestore.DocumentReference, run: AgentRun, action: AgentAction, plan: PlanEntitlements): Promise<Observation> {
  const {tool, args} = action;
  const db = ref.firestore;
  const id = `nova_${ref.id}_${run.steps.length}`;
  if (tool === 'save_note') {
    const entryRef = db.collection('entries').doc(id);
    const usageRef = db.collection('entitlement_usage').doc(run.user_id);
    const usage = (await tx.get(usageRef)).data();
    let count = typeof usage?.entries === 'number' ? usage.entries : undefined;
    if (plan.entryLimit !== null && count === undefined) count = (await tx.get(db.collection('entries').where('user_id', '==', run.user_id).limit(plan.entryLimit + 1))).size;
    assertEntryAdmission(plan, count || 0, 1);
    tx.create(entryRef, {user_id: run.user_id, title: args.title, category: args.category, fields: {content: args.content, category: args.category},
      field_definitions: [{id: 'content', name: 'Content', type: 'textarea'}], created_at: stamp(), updated_at: stamp(), processed: false, agent_run_id: ref.id});
    if (count !== undefined) tx.set(usageRef, {user_id: run.user_id, entries: count + 1, updated_at: stamp()}, {merge: true});
    return {summary: `Saved ${args.title}`, result: text({id, title: args.title, saved: true}), output: {id, title: String(args.title)}};
  }
  if (tool === 'update_note' || tool === 'delete_note') {
    const entryRef = db.collection('entries').doc(String(args.id));
    const snap = await tx.get(entryRef);
    if (!snap.exists || snap.data()?.user_id !== run.user_id) throw new Error('Entry not found');
    if (revision(snap.updateTime!) !== args.revision) throw new Error('This entry changed. Read it again before making changes.');
    const read = run.steps.some(step => {
      if (step.tool !== 'read_entry') return false;
      try {const observed = JSON.parse(step.result); return observed.id === args.id && observed.revision === args.revision;}
      catch {return false;}
    });
    if (!read) throw new Error('A complete read of this entry is required before changing it. Large entries need manual editing.');
    if (tool === 'delete_note') {
      if (!run.approved) throw new Error('Deletion requires approval');
      const usageRef = db.collection('entitlement_usage').doc(run.user_id);
      const usage = (await tx.get(usageRef)).data();
      tx.delete(entryRef);
      if (typeof usage?.entries === 'number') tx.update(usageRef, {entries: Math.max(0, usage.entries - 1), updated_at: stamp()});
      return {summary: `Deleted ${snap.data()?.title || 'entry'}`, result: text({id: snap.id, deleted: true})};
    }
    tx.update(entryRef, {title: args.title, fields: {...snap.data()?.fields, content: args.content}, updated_at: stamp(), processed: false});
    return {summary: `Updated ${args.title}`, result: text({id: snap.id, updated: true}), output: {id: snap.id, title: String(args.title)}};
  }
  if (tool === 'set_reminder') {
    const when = futureTime(args.when, Date.now());
    tx.create(db.collection('reminders').doc(id), {user_id: run.user_id, text: args.text, trigger_at: stamp(when), status: 'pending', created_at: stamp(), agent_run_id: ref.id});
    return {summary: `Scheduled reminder for ${args.when}`, result: text({id, text: args.text, when: args.when, scheduled: true})};
  }
  throw new Error('This write action is not available');
}
