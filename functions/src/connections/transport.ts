import {lookup} from 'dns/promises';
import {request} from 'https';
import {isIP} from 'net';
import {ConnectionError} from './types';

// Connect only to public IPv4 addresses. Pin DNS to the checked address for this
// request; validating a hostname and then resolving it again permits rebinding.
export function publicIPv4(address: string): boolean {
  if (isIP(address) !== 4) return false;
  const [a, b, c] = address.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
}
export function externalUrl(value: string): URL {
  let url: URL;
  try {url = new URL(value);} catch {throw new ConnectionError('Enter a valid HTTPS tool server URL');}
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search || (url.port && url.port !== '443') ||
    !url.hostname.includes('.') || isIP(url.hostname) || url.hostname.startsWith('[')) {
    throw new ConnectionError('Use a public HTTPS hostname on port 443, without credentials or query parameters');
  }
  return url;
}

export interface HttpResult {status: number; headers: Record<string, string | string[] | undefined>; body: string}
export const networkDependencies = {lookup};
/** Bounded HTTPS transport. No redirects, proxy variables, cookies, or DNS re-resolution. */
export async function safeRequest(url: URL, options: {method?: string; headers?: Record<string, string>; body?: string; rpcId?: number} = {}): Promise<HttpResult> {
  const addresses = await networkDependencies.lookup(url.hostname, {family: 4, all: true});
  if (!addresses.length || addresses.some(item => !publicIPv4(item.address))) throw new ConnectionError('This server does not resolve to a public internet address');
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = (error?: Error, result?: HttpResult) => {
      if (finished) return; finished = true; clearTimeout(timer);
      if (error) reject(error); else resolve(result!);
    };
    const req = request(url, {method: options.method || 'GET', headers: options.headers, agent: false, family: 4,
      lookup: (_host, _options, callback) => callback(null, addresses[0].address, 4)}, response => {
      const status = response.statusCode || 502;
      if (status >= 300 && status < 400) {finish(new ConnectionError('The tool server redirected the request. Use its final HTTPS endpoint.')); response.destroy(); return;}
      let body = '';
      let size = 0;
      let sse = '';
      response.setEncoding('utf8');
      response.on('data', (chunk: string) => {
        size += Buffer.byteLength(chunk);
        if (size > 256000) {finish(new ConnectionError('The external response exceeded 256 KB. Narrow the request.')); response.destroy(); return;}
        body += chunk;
        // Stop a streaming response as soon as the matching JSON-RPC response
        // arrives. A server need not close its event stream after the result.
        if (options.rpcId !== undefined && String(response.headers['content-type']).includes('text/event-stream')) {
          sse += chunk;
          const events = sse.split(/\r?\n\r?\n/); sse = events.pop() || '';
          for (const event of events) {
            const data = event.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
            try {
              const message = JSON.parse(data);
              if (message.id === options.rpcId && ('result' in message || 'error' in message)) {
                finish(undefined, {status, headers: response.headers, body: JSON.stringify(message)}); response.destroy(); return;
              }
            } catch { /* Ignore comments and incomplete event data. */ }
          }
        }
      });
      response.on('end', () => finish(undefined, {status, headers: response.headers, body}));
      response.on('error', () => finish(new ConnectionError('The external connection ended before its response arrived', 502)));
    });
    const timer = setTimeout(() => {finish(new ConnectionError('The external service timed out', 504)); req.destroy();}, 25000);
    req.on('error', () => finish(new ConnectionError('Could not reach the external service', 502)));
    req.end(options.body);
  });
}
