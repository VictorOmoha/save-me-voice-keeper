import {ConnectionError, ExternalTool} from './types';
import {externalUrl, safeRequest} from './transport';

export const mcpDependencies = {request: safeRequest};
const versions = ['2025-11-25', '2025-06-18', '2025-03-26'];
interface RpcResult {
  protocolVersion?: string; capabilities?: {tools?: unknown}; tools?: ExternalTool[]; nextCursor?: string;
  isError?: boolean; content?: {type?: string; text?: string}[]; structuredContent?: Record<string, unknown>;
}
export async function openMcp(endpoint: string, token = '') {
  const url = externalUrl(endpoint);
  if (token.length > 8000 || /[\r\n]/.test(token)) throw new ConnectionError('Invalid server access token');
  const headers: Record<string, string> = {'Content-Type': 'application/json', Accept: 'application/json, text/event-stream'};
  if (token) headers.Authorization = `Bearer ${token}`;
  let sequence = 0;
  async function rpc(method: string, params: Record<string, unknown>, notification = false): Promise<RpcResult> {
    const id = notification ? undefined : ++sequence;
    const response = await mcpDependencies.request(url, {method: 'POST', headers,
      body: JSON.stringify({jsonrpc: '2.0', ...(id === undefined ? {} : {id}), method, params}), rpcId: id});
    if (response.status === 401 || response.status === 403) throw new ConnectionError('The tool server rejected access. Update its token in Connections.', 401);
    if (response.status < 200 || response.status >= 300) throw new ConnectionError(`The tool server returned HTTP ${response.status}`, 502);
    if (notification) return {};
    let message;
    try {message = JSON.parse(response.body);} catch {throw new ConnectionError('The server did not return a supported MCP response');}
    if (message.jsonrpc !== '2.0' || message.id !== id || !message.result || typeof message.result !== 'object' || message.error) throw new ConnectionError('The tool server could not complete this request', 502);
    if (method === 'initialize') {
      const session = response.headers['mcp-session-id'];
      if (session !== undefined) {
        if (typeof session !== 'string' || !/^[\x21-\x7e]{1,1024}$/.test(session)) throw new ConnectionError('Invalid MCP session');
        headers['MCP-Session-Id'] = session;
      }
    }
    return message.result;
  }
  const initialized = await rpc('initialize', {protocolVersion: versions[0], capabilities: {}, clientInfo: {name: 'SaveMe Nova', version: '1.0.0'}});
  if (!versions.includes(initialized.protocolVersion || '') || !initialized.capabilities?.tools) throw new ConnectionError('This server does not support compatible MCP tools');
  headers['MCP-Protocol-Version'] = initialized.protocolVersion!;
  await rpc('notifications/initialized', {}, true);
  return {
    async list(): Promise<ExternalTool[]> {
      const tools: ExternalTool[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < 4; page++) {
        const result = await rpc('tools/list', cursor ? {cursor} : {});
        if (!Array.isArray(result.tools)) throw new ConnectionError('Invalid external tool catalog');
        for (const tool of result.tools) {
          if (!tool || typeof tool.name !== 'string' || !/^[A-Za-z0-9_.-]{1,128}$/.test(tool.name) ||
            !tool.inputSchema || tool.inputSchema.type !== 'object' || JSON.stringify(tool.inputSchema).length > 12000) continue;
          if (!tools.some(item => item.name === tool.name)) tools.push({name: tool.name, description: String(tool.description || tool.name).slice(0, 1000), inputSchema: tool.inputSchema});
          if (JSON.stringify(tools).length > 180000) throw new ConnectionError('The tool catalog is too large. Use a server with fewer tools.');
          if (tools.length >= 50) return tools;
        }
        cursor = typeof result.nextCursor === 'string' ? result.nextCursor : undefined;
        if (!cursor) break;
      }
      if (!tools.length) throw new ConnectionError('The server did not offer any supported tools');
      if (JSON.stringify(tools).length > 180000) throw new ConnectionError('The tool catalog is too large. Use a server with fewer tools.');
      return tools;
    },
    async call(name: string, args: Record<string, unknown>) {
      const result = await rpc('tools/call', {name, arguments: args});
      // Only text and structured data enter Nova's context. Never fetch remote
      // resource links or render provider HTML; descriptions/results are untrusted.
      return {success: result.isError !== true, content: Array.isArray(result.content) ? result.content.filter(item => item?.type === 'text').map(item => String(item.text || '').slice(0, 14000)).slice(0, 8) : [],
        ...(result.structuredContent && typeof result.structuredContent === 'object' ? {structuredContent: result.structuredContent} : {})};
    },
    async close() {
      if (headers['MCP-Session-Id']) await mcpDependencies.request(url, {method: 'DELETE', headers}).catch(() => {});
    },
  };
}
