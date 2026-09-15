import {FormEvent, useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {CalendarDays, FileText, Loader2, Plug, RefreshCw} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';
import {AppConnection, ConnectionList, connectionRequest, GOOGLE_RETURN_KEY, validateGoogleReturn} from '@/services/connections';

const errorText = (error: unknown) => error instanceof Error ? error.message : 'Could not update the connection.';
const callbacks = new Map<string, Promise<unknown>>();
const googleApps = [
  {provider: 'google_calendar' as const, name: 'Google Calendar', Icon: CalendarDays, description: 'Read your primary calendar and create events after you review them.'},
  {provider: 'google_drive' as const, name: 'Google Drive', Icon: FileText, description: 'Find your files and read Google documents, spreadsheets, slides, and text files.'},
];

export function ConnectionTools({connection, busy, onSave}: {connection: AppConnection; busy: boolean; onSave: (tools: string[]) => void}) {
  const [selected, setSelected] = useState(connection.enabled_tools);
  return <details className="mt-4 rounded-xl border p-4" open={connection.enabled_tools.length === 0}>
    <summary className="cursor-pointer text-sm font-medium">Available tools · {connection.enabled_tools.length} enabled</summary>
    <p className="mt-3 text-xs text-muted-foreground">Choose the tools Nova may use. Each external server call asks for your approval and shows the data it will send.</p>
    <div className="mt-4 max-h-80 space-y-4 overflow-auto">{connection.tools.map(tool => <label key={tool.name} className="flex items-start gap-3 text-sm">
      <input type="checkbox" disabled={busy} className="mt-1 h-4 w-4 shrink-0 accent-primary" checked={selected.includes(tool.name)} onChange={event => setSelected(current => event.target.checked ? [...current, tool.name] : current.filter(name => name !== tool.name))} />
      <span className="min-w-0"><span className="block break-words font-medium">{tool.name}</span><span className="mt-1 block break-words text-xs leading-relaxed text-muted-foreground">{tool.description}</span></span>
    </label>)}</div>
    <Button className="mt-4" size="sm" disabled={busy} onClick={() => onSave(selected)}>Save tool access</Button>
  </details>;
}

function ConnectionsWorkspace({uid}: {uid: string}) {
  const [data, setData] = useState<ConnectionList | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [token, setToken] = useState('');
  const [disconnect, setDisconnect] = useState('');
  const [callback] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {code: params.get('code'), state: params.get('state'), error: params.get('error')};
  });
  const load = useCallback(async () => setData(await connectionRequest<ConnectionList>(uid, {operation: 'list'})), [uid]);
  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        if (callback.state && (callback.code || callback.error)) {
          window.history.replaceState(null, '', '/settings?tab=connections');
          const key = `${uid}:${callback.state}`;
          let completion = callbacks.get(key);
          if (!completion) {
            const pending = validateGoogleReturn(sessionStorage.getItem(GOOGLE_RETURN_KEY), uid, callback.state);
            if (callback.error) {sessionStorage.removeItem(GOOGLE_RETURN_KEY); throw new Error('Google access was not granted. You can connect again when ready.');}
            completion = connectionRequest(uid, {operation: 'google_finish', provider: pending.provider, state: callback.state, code: callback.code});
            callbacks.set(key, completion);
            completion.finally(() => sessionStorage.removeItem(GOOGLE_RETURN_KEY)).catch(() => {});
          }
          if (active) setBusy(true);
          await completion;
          if (active) setMessage('Google account connected. Choose it when you start a Nova goal.');
        }
      } catch (e) {if (active) setError(errorText(e));}
      finally {
        try {const next = await connectionRequest<ConnectionList>(uid, {operation: 'list'}); if (active) setData(next);}
        catch (e) {if (active) setError(errorText(e));}
        if (active) setBusy(false);
      }
    }
    void initialize();
    return () => {active = false;};
  }, [uid, callback]);
  async function act(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {await work();} catch (e) {setError(errorText(e));} finally {setBusy(false);}
  }
  function connectGoogle(provider: string) {
    void act(async () => {
      const result = await connectionRequest<{url: string; state: string; provider: string}>(uid, {operation: 'google_start', provider});
      const url = new URL(result.url);
      if (url.origin !== 'https://accounts.google.com') throw new Error('Invalid Google authorization URL');
      sessionStorage.setItem(GOOGLE_RETURN_KEY, JSON.stringify({uid, state: result.state, provider: result.provider, expires: Date.now() + 600000}));
      window.location.assign(url.toString());
    });
  }
  function saveServer(event: FormEvent) {
    event.preventDefault();
    void act(async () => {
      await connectionRequest(uid, {operation: 'mcp_save', name, endpoint, token});
      setToken(''); setName(''); setEndpoint(''); await load();
      setMessage('Server connected. Select its tools below to make them available to Nova.');
    });
  }
  const remove = (connection: AppConnection) => void act(async () => {
    await connectionRequest(uid, {operation: 'disconnect', id: connection.id, revision: connection.revision});
    setDisconnect(''); await load(); setMessage(`${connection.name} disconnected. Nova can no longer start calls through it.`);
  });
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">Connections</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Give Nova access to the applications you use. Choose which connections each goal can use and review external actions before they run.</p></div><Button variant="outline" size="sm" disabled={busy} onClick={() => void act(load)}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div>
    {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">{error}</p>}
    {message && <p role="status" className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">{message}</p>}
    {busy && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Updating connection…</p>}
    {!data && !error && <p className="text-sm text-muted-foreground">Loading connections…</p>}
    <div className="grid gap-4 md:grid-cols-2">{googleApps.map(app => {
      const connected = data?.connections.find(item => item.provider === app.provider);
      return <section key={app.provider} className="rounded-2xl border bg-card p-5"><app.Icon className="h-6 w-6 text-primary" /><h3 className="mt-3 font-semibold">{app.name}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{app.description}</p>
        {connected && <p className="mt-3 break-all text-sm">Connected as <strong>{connected.account}</strong></p>}
        <div className="mt-4 flex flex-wrap gap-2"><Button variant={connected ? 'outline' : 'default'} disabled={busy || !data?.googleAvailable} onClick={() => connectGoogle(app.provider)}>{connected ? 'Reconnect' : 'Connect'}</Button>{connected && <Button variant="ghost" disabled={busy} onClick={() => setDisconnect(connected.id)}>Disconnect</Button>}</div>
        {connected && disconnect === connected.id && <div className="mt-3 text-sm"><p>Stop Nova’s access to this account? Actions already sent may still finish.</p><div className="mt-2 flex gap-2"><Button variant="destructive" size="sm" disabled={busy} onClick={() => remove(connected)}>Disconnect account</Button><Button variant="ghost" size="sm" onClick={() => setDisconnect('')}>Keep connected</Button></div></div>}
      </section>;
    })}</div>
    {data && !data.googleAvailable && <p className="text-sm text-muted-foreground">Google connections are awaiting administrator setup. External tool servers are available below.</p>}
    <section className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-2"><Plug className="h-5 w-5 text-primary" /><h3 className="font-semibold">Connect an external tool server</h3></div><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Connect a service that supports MCP, a standard for giving AI agents access to tools. Use its public HTTPS endpoint and, if required, a server access token. OAuth-only and local servers are not supported here yet.</p>
      <form onSubmit={saveServer} className="mt-5 space-y-4"><div><label htmlFor="connection-name" className="text-sm font-medium">Connection name</label><input id="connection-name" required maxLength={80} value={name} onChange={e => setName(e.target.value)} className="mt-1.5 w-full rounded-lg border bg-background p-3 text-sm" placeholder="My project tools" /></div>
        <div><label htmlFor="connection-endpoint" className="text-sm font-medium">Server URL</label><input id="connection-endpoint" type="url" required value={endpoint} onChange={e => setEndpoint(e.target.value)} className="mt-1.5 w-full rounded-lg border bg-background p-3 text-sm" placeholder="https://tools.example.com/mcp" /></div>
        <div><label htmlFor="connection-token" className="text-sm font-medium">Access token <span className="font-normal text-muted-foreground">(if required)</span></label><input id="connection-token" type="password" autoComplete="off" maxLength={8000} value={token} onChange={e => setToken(e.target.value)} className="mt-1.5 w-full rounded-lg border bg-background p-3 text-sm" /><p className="mt-1.5 text-xs text-muted-foreground">Stored on the server and never included in Nova’s prompts. Connecting the same URL refreshes its tools; leave the token blank to keep its existing token.</p></div>
        <Button type="submit" disabled={busy || !name.trim() || !endpoint.trim()}>Connect and discover tools</Button>
      </form>
    </section>
    {data?.connections.filter(item => item.provider === 'mcp').map(connection => <section key={connection.id} className="rounded-2xl border bg-card p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words font-semibold">{connection.name}</h3><p className="mt-1 break-all text-xs text-muted-foreground">{connection.endpoint}</p></div><Button variant="ghost" size="sm" disabled={busy} onClick={() => setDisconnect(connection.id)}>Disconnect</Button></div>
      <ConnectionTools key={connection.revision} connection={connection} busy={busy} onSave={tools => void act(async () => {await connectionRequest(uid, {operation: 'tools', id: connection.id, revision: connection.revision, tools}); await load(); setMessage('Tool access updated.');})} />
      {disconnect === connection.id && <div className="mt-3 text-sm"><p>Stop Nova’s access to this server? Actions already sent may still finish.</p><div className="mt-2 flex gap-2"><Button variant="destructive" size="sm" disabled={busy} onClick={() => remove(connection)}>Disconnect server</Button><Button variant="ghost" size="sm" onClick={() => setDisconnect('')}>Keep connected</Button></div></div>}
    </section>)}
    <p className="text-sm text-muted-foreground">Ready to use your connections? <Link to="/agent" className="text-primary underline">Give Nova a goal</Link>. You can also remove SaveMe’s Google permission from <a href="https://myaccount.google.com/connections" target="_blank" rel="noopener noreferrer" className="text-primary underline">your Google account</a>.</p>
  </div>;
}
export function ConnectionsSettings() {
  const {user} = useAuth();
  return user ? <ConnectionsWorkspace key={user.uid} uid={user.uid} /> : <p>Sign in to manage connections.</p>;
}
