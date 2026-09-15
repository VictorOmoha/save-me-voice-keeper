import {Connection, ConnectionError, ExternalTool, requiredText} from './types';
import {safeRequest} from './transport';

export const googleDependencies = {request: safeRequest};
export const GOOGLE_SCOPES = {
  google_calendar: 'https://www.googleapis.com/auth/calendar.events.owned',
  google_drive: 'https://www.googleapis.com/auth/drive.readonly',
};
const schema = (properties: Record<string, unknown>, required = Object.keys(properties)) => ({type: 'object', properties, required, additionalProperties: false});
const string = (description: string) => ({type: 'string', description});
export const GOOGLE_TOOLS: Record<keyof typeof GOOGLE_SCOPES, ExternalTool[]> = {
  google_calendar: [
    {name: 'list_events', description: 'Read up to 50 events from the connected account’s primary calendar. Use absolute timestamps with timezone. Check this before creating an event.',
      inputSchema: schema({start: string('Start of the time range, ISO timestamp with timezone'), end: string('End of the time range, ISO timestamp with timezone')})},
    {name: 'create_event', description: 'Create an event on the connected account’s primary calendar, after user approval. Does not invite attendees or send email. Returns the event link.',
      inputSchema: schema({title: string('Event title'), description: string('Event description, or empty'), start: string('Start ISO timestamp with timezone'), end: string('End ISO timestamp with timezone')})},
  ],
  google_drive: [
    {name: 'search_files', description: 'Search names in the connected Google Drive. Returns up to 20 files with ids and links. Empty query lists recently modified files.', inputSchema: schema({query: string('Words to find in file names, or empty')})},
    {name: 'read_file', description: 'Read one file returned by search_files. Supports Google Docs, Slides, Sheets (first sheet as CSV), and plain text. Other types return metadata with an explanation.', inputSchema: schema({file_id: string('Exact file id returned by search_files')})},
  ],
};
export async function googleToken(body: Record<string, string>): Promise<{access_token: string; refresh_token?: string; scope?: string}> {
  const response = await googleDependencies.request(new URL('https://oauth2.googleapis.com/token'), {method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams(body).toString()});
  if (response.status !== 200) throw new ConnectionError('Google access has expired or was declined. Reconnect this account in Connections.', 401);
  let result;
  try {result = JSON.parse(response.body);} catch {throw new ConnectionError('Google returned an invalid token response', 502);}
  if (typeof result.access_token !== 'string' || !result.access_token || /[\r\n]/.test(result.access_token)) throw new ConnectionError('Google did not return an access token', 502);
  return result;
}
export function googleConfig() {
  const clientId = process.env.NOVA_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.NOVA_GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new ConnectionError('Google connections need the application’s OAuth configuration. Contact the SaveMe administrator.', 503);
  return {client_id: clientId, client_secret: clientSecret};
}
export function timeRange(args: Record<string, unknown>) {
  const times = ['start', 'end'].map(key => {
    const value = requiredText(args[key], key, 80);
    if (!/(Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw new ConnectionError('Use dates with an explicit timezone');
    return value;
  });
  if (Date.parse(times[1]) <= Date.parse(times[0]) || Date.parse(times[1]) - Date.parse(times[0]) > 93 * 86400000) throw new ConnectionError('Choose an end after the start, within 93 days');
  return {start: times[0], end: times[1]};
}
/** Validate completely before reserving an external side effect. */
export function validateGoogleArgs(provider: keyof typeof GOOGLE_SCOPES, name: string, args: Record<string, unknown>) {
  const tool = GOOGLE_TOOLS[provider].find(item => item.name === name);
  if (!tool) throw new ConnectionError('This Google tool is unavailable');
  const properties = tool.inputSchema.properties as Record<string, unknown>;
  if (Object.keys(args).some(key => !Object.prototype.hasOwnProperty.call(properties, key)) || Object.keys(properties).some(key => typeof args[key] !== 'string')) throw new ConnectionError('Invalid Google tool arguments');
  if (name === 'list_events' || name === 'create_event') timeRange(args);
  if (name === 'create_event') {requiredText(args.title, 'event title', 300); if (String(args.description).length > 8000) throw new ConnectionError('Event description is too long');}
  if (name === 'search_files' && String(args.query).length > 300) throw new ConnectionError('Search query is too long');
  if (name === 'read_file' && !/^[A-Za-z0-9_-]{1,200}$/.test(String(args.file_id))) throw new ConnectionError('Invalid Google file id');
}
export async function prepareGoogle(connection: Connection, name: string, args: Record<string, unknown>, effectId: string) {
  if (connection.provider === 'mcp') throw new ConnectionError('Invalid Google connection');
  validateGoogleArgs(connection.provider, name, args);
  const token = await googleToken({...googleConfig(), refresh_token: connection.credentials_secret.refresh_token || '', grant_type: 'refresh_token'});
  const headers = {Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json'};
  async function api(path: string, body?: unknown) {
    const result = await googleDependencies.request(new URL(`https://www.googleapis.com/${path}`), {headers, method: body ? 'POST' : 'GET', ...(body ? {body: JSON.stringify(body)} : {})});
    if (result.status === 401 || result.status === 403) throw new ConnectionError('Google denied access. Reconnect this account and grant the requested permission.', 401);
    if (result.status < 200 || result.status >= 300) throw new ConnectionError(`Google could not complete this action (HTTP ${result.status}).`, 502);
    return result;
  }
  return async (): Promise<Record<string, unknown>> => {
    if (name === 'list_events') {
      const {start, end} = timeRange(args);
      const params = new URLSearchParams({timeMin: start, timeMax: end, singleEvents: 'true', orderBy: 'startTime', maxResults: '50',
        fields: 'items(id,summary,description,start,end,status,htmlLink,location),nextPageToken'});
      const result = JSON.parse((await api(`calendar/v3/calendars/primary/events?${params}`)).body);
      return {success: true, events: result.items || [], moreAvailable: Boolean(result.nextPageToken), note: result.nextPageToken ? 'Narrow the date range to see additional events.' : ''};
    }
    if (name === 'create_event') {
      const {start, end} = timeRange(args);
      const result = JSON.parse((await api('calendar/v3/calendars/primary/events?sendUpdates=none', {id: effectId, summary: args.title, description: args.description,
        start: {dateTime: start}, end: {dateTime: end}})).body);
      return {success: true, id: result.id, title: result.summary, url: result.htmlLink, start: result.start, end: result.end};
    }
    if (name === 'search_files') {
      const query = String(args.query).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const params = new URLSearchParams({q: `trashed = false${query ? ` and name contains '${query}'` : ''}`, pageSize: '20', orderBy: 'modifiedTime desc',
        fields: 'nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink,size)', spaces: 'drive'});
      const result = JSON.parse((await api(`drive/v3/files?${params}`)).body);
      return {success: true, files: result.files || [], moreAvailable: Boolean(result.nextPageToken)};
    }
    const path = `drive/v3/files/${encodeURIComponent(String(args.file_id))}`;
    const file = JSON.parse((await api(`${path}?fields=id,name,mimeType,webViewLink,size`)).body);
    const exports: Record<string, string> = {'application/vnd.google-apps.document': 'text/plain', 'application/vnd.google-apps.presentation': 'text/plain', 'application/vnd.google-apps.spreadsheet': 'text/csv'};
    const format = exports[file.mimeType];
    if (Number(file.size) > 200000) return {success: true, file, contentAvailable: false, reason: 'This file is too large for the connected text reader. Choose a smaller document.'};
    if (!format && !['text/plain', 'text/markdown', 'text/csv'].includes(file.mimeType)) return {success: true, file, contentAvailable: false, reason: 'This reader supports Google Docs, Slides, Sheets, and plain text. Open the file link for other formats.'};
    const content = (await api(format ? `${path}/export?mimeType=${encodeURIComponent(format)}` : `${path}?alt=media`)).body;
    return {success: true, file, content: content.slice(0, 12000), truncated: content.length > 12000, ...(file.mimeType === 'application/vnd.google-apps.spreadsheet' ? {note: 'CSV export contains the first sheet only.'} : {})};
  };
}
