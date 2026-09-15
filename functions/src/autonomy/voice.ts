import * as admin from 'firebase-admin';
import {randomUUID} from 'crypto';
import {assertVoiceAiAccess, readUserEntitlements} from '../entitlements/entitlements';
import {AgentRequestError, createRun} from './service';
import {listConnections} from '../connections/service';

export async function voiceGoalTool(name: string, args: Record<string, unknown>, uid: string): Promise<Record<string, unknown>> {
  const db = admin.firestore();
  try {
    if (name === 'getConnectedApps') {
      const connections = await listConnections(db, uid);
      return {success: true, connections: connections.map(item => ({id: item.id, name: item.name, account: item.account, tools: item.enabled_tools})), settingsUrl: '/settings?tab=connections'};
    }
    if (name === 'startAgentGoal') {
      if (!process.env.OPENAI_API_KEY) return {success: false, error: 'Background goals are not configured'};
      assertVoiceAiAccess(await readUserEntitlements(uid, db));
      const runId = await createRun(db, uid, {goal: args.goal, requestId: randomUUID(), writeMode: args.autoSave === true ? 'auto' : 'review', allowWeb: args.allowWeb === true,
        connectionIds: args.connectionIds || [], maxSteps: Array.isArray(args.connectionIds) && args.connectionIds.length ? 24 : 16});
      return {success: true, runId, status: 'queued', url: `/agent?run=${runId}`, message: 'The goal has started in the background. The work is not completed yet. Open Nova goals to track it or approve changes.'};
    }
    const snapshot = await db.collection('nova_agent_runs').where('user_id', '==', uid).orderBy('created_at', 'desc').limit(5).get();
    return {success: true, goals: snapshot.docs.map(doc => {const data = doc.data(); return {id: doc.id, goal: data.goal, status: data.status,
      question: data.question, steps: data.steps?.length || 0, result: String(data.result || '').slice(0, 2000), url: `/agent?run=${doc.id}`};})};
  } catch (error) {
    return {success: false, error: error instanceof AgentRequestError ? error.message : name === 'startAgentGoal'
      ? 'The creation outcome is uncertain. Do not retry automatically. Use getAgentGoals or open Nova goals to check whether it started.'
      : 'Nova could not read background goals. Please open Nova goals and try again.'};
  }
}
