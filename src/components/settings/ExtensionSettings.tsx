import {useState} from "react";
import {auth} from "@/lib/firebase";
import {Button} from "@/components/ui/button";

const endpoint = "/api/extension/pairing-code";
export function ExtensionSettings() {
  const [code, setCode] = useState<string>();
  const [expiresAt, setExpiresAt] = useState<string>();
  const [error, setError] = useState<string>();
  const generate = async () => {
    setError(undefined);
    const token = await auth.currentUser?.getIdToken();
    if (!token) { setError("Sign in to generate a code."); return; }
    const response = await fetch(endpoint, {method: "POST", headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"}});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError("Could not generate a pairing code. Try again."); return; }
    setCode(data.code); setExpiresAt(data.expiresAt);
  };
  return <section id="connect-extension" className="galvanized-card p-6 space-y-4">
    <h2 className="archive-title text-lg">CONNECT BROWSER EXTENSION</h2>
    <p className="text-sm text-muted-foreground">Generate a short-lived, one-time code, then enter it manually in the SaveMe.Space extension. No account token is sent through this page.</p>
    {code && <div className="space-y-2"><code className="text-2xl tracking-widest" aria-label="Pairing code">{code}</code><p className="text-xs text-muted-foreground">Expires {new Date(expiresAt!).toLocaleTimeString()} and can be used once.</p></div>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Button onClick={generate}>Generate one-time code</Button>
  </section>;
}
