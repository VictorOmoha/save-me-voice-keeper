import {afterEach, describe, expect, it, vi} from 'vitest';
import {externalUrl, publicIPv4} from './transport';
import {mcpDependencies, openMcp} from './mcp';
import {googleDependencies, prepareGoogle, validateGoogleArgs} from './google';
import {Connection, publicConnection} from './types';
import {assertConnectionAction} from './agent';
import {newRun, requiresApproval, validateAction} from '../autonomy/policy';
import {validateToolArgs} from '../voiceToolValidation';

afterEach(() => {vi.restoreAllMocks(); vi.unstubAllEnvs();});
const id = 'a'.repeat(64);
const connection: Connection = {user_id: 'alice', provider: 'mcp', name: 'Example', account: 'tools.example.com', revision: 'revision-1', endpoint: 'https://tools.example.com/mcp', tools: [], enabled_tools: ['list_events'], credentials_secret: {bearer_token: 'PRIVATE'}, created_at: null, updated_at: null};
describe('connection boundaries', () => {
  it('preserves explicitly selected connections when delegating through voice', () => {
    const result = validateToolArgs('startAgentGoal', {goal: 'Check my calendar', autoSave: false, allowWeb: false, connectionIds: [id]});
    expect(result.sanitizedArgs?.connectionIds).toEqual([id]);
    expect(validateToolArgs('startAgentGoal', {goal: 'Check my calendar', autoSave: false, allowWeb: false, connectionIds: ['invented']}).valid).toBe(false);
    expect(validateToolArgs('getConnectedApps', {}).valid).toBe(true);
  });
  it.each(['127.0.0.1', '10.0.0.1', '172.16.2.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '198.18.1.1', '224.0.0.1', '::1', '::ffff:127.0.0.1'])('blocks nonpublic addresses: %s', address => expect(publicIPv4(address)).toBe(false));
  it.each(['http://example.com/mcp', 'https://user:secret@example.com/mcp', 'https://127.0.0.1', 'https://[::1]', 'https://example.com:8443/mcp', 'https://example.com/mcp?token=secret', 'https://localhost'])('rejects unsafe endpoint %s', url => expect(() => externalUrl(url)).toThrow());
  it('allows public HTTPS and omits all credentials from metadata', () => {
    expect(publicIPv4('8.8.8.8')).toBe(true);
    expect(externalUrl('https://tools.example.com/mcp').pathname).toBe('/mcp');
    expect(JSON.stringify(publicConnection(id, connection))).not.toContain('PRIVATE');
  });
  it('does not trust an MCP tool name to bypass approval', () => {
    const run = newRun('alice', 'Read calendar', {connectionIds: [id]}, null);
    const action = {tool: 'read_external_tool', args: {connection_id: id, connection_revision: connection.revision, tool_name: 'list_events', arguments_json: '{}'}};
    expect(() => assertConnectionAction(run, action, connection)).toThrow('approval');
    expect(() => assertConnectionAction({...run, connection_ids: []}, action, connection)).toThrow('not enabled');
    expect(() => assertConnectionAction(run, action, {...connection, revision: 'new'})).toThrow('changed');
    expect(requiresApproval({...action, tool: 'call_external_tool'}, {write_mode: 'auto'})).toBe(true);
  });
  it('requires an actual JSON argument object', () => {
    const args = {connection_id: id, connection_revision: 'rev', tool_name: 'search_files', arguments_json: '[]'};
    expect(() => validateAction({tool: 'read_external_tool', args})).toThrow('JSON object');
    expect(() => validateAction({tool: 'read_external_tool', args: {...args, arguments_json: '{bad'}})).toThrow();
  });
});
describe('MCP protocol', () => {
  it('negotiates a session, paginates discovery, and calls with the negotiated headers', async () => {
    const request = vi.spyOn(mcpDependencies, 'request').mockImplementation(async (_url, options) => {
      const body = JSON.parse(options?.body || '{}');
      if (options?.method === 'DELETE' || body.method === 'notifications/initialized') return {status: 202, headers: {}, body: ''};
      const result = body.method === 'initialize' ? {protocolVersion: '2025-06-18', capabilities: {tools: {}}} : body.method === 'tools/list' ?
        {tools: [{name: body.params.cursor ? 'second' : 'first', inputSchema: {type: 'object'}}], ...(body.params.cursor ? {} : {nextCursor: 'next'})} : {content: [{type: 'text', text: 'Done'}, {type: 'resource_link', uri: 'https://example.com/private'}]};
      return {status: 200, headers: {'mcp-session-id': 'session-1'}, body: JSON.stringify({jsonrpc: '2.0', id: body.id, result})};
    });
    const session = await openMcp(connection.endpoint!, 'secret');
    expect((await session.list()).map(tool => tool.name)).toEqual(['first', 'second']);
    expect(await session.call('first', {})).toEqual({success: true, content: ['Done']});
    await session.close();
    const call = request.mock.calls.find(([, options]) => options?.body?.includes('tools/call'))!;
    expect(call[1]?.headers).toMatchObject({'MCP-Session-Id': 'session-1', 'MCP-Protocol-Version': '2025-06-18', Authorization: 'Bearer secret'});
  });
  it('does not expose provider error bodies containing credentials', async () => {
    vi.spyOn(mcpDependencies, 'request').mockResolvedValue({status: 401, headers: {}, body: 'PRIVATE TOKEN'});
    await expect(openMcp(connection.endpoint!)).rejects.toThrow('rejected access');
  });
});
describe('Google tools', () => {
  it('rejects unknown properties, arbitrary downloads, and ambiguous dates', () => {
    expect(() => validateGoogleArgs('google_drive', 'read_file', {file_id: 'https://example.com'})).toThrow('file id');
    expect(() => validateGoogleArgs('google_calendar', 'create_event', {title: 'Meeting', description: '', start: '2026-10-01', end: '2026-10-02'})).toThrow('timezone');
    expect(() => validateGoogleArgs('google_calendar', 'create_event', {title: 'Meeting', description: '', start: '2026-10-01T12:00:00Z', end: '2026-10-01T13:00:00Z', attendees: []})).toThrow('arguments');
  });
  it('refreshes authorization and creates an event with a stable id and no invitations', async () => {
    vi.stubEnv('NOVA_GOOGLE_CLIENT_ID', 'client'); vi.stubEnv('NOVA_GOOGLE_CLIENT_SECRET', 'secret');
    const request = vi.spyOn(googleDependencies, 'request').mockResolvedValueOnce({status: 200, headers: {}, body: JSON.stringify({access_token: 'access'})})
      .mockResolvedValueOnce({status: 200, headers: {}, body: JSON.stringify({id, summary: 'Focus', htmlLink: 'https://calendar.google.com/event'})});
    const execute = await prepareGoogle({...connection, provider: 'google_calendar', credentials_secret: {refresh_token: 'refresh'}}, 'create_event', {title: 'Focus', description: '', start: '2026-10-01T12:00:00Z', end: '2026-10-01T13:00:00Z'}, id);
    expect(await execute()).toMatchObject({success: true, id});
    expect(request.mock.calls[1][0].search).toBe('?sendUpdates=none');
    const event = JSON.parse(request.mock.calls[1][1]!.body!);
    expect(event.id).toBe(id); expect(event).not.toHaveProperty('attendees');
  });
});
