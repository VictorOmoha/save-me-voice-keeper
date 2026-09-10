import {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup} from 'firebase/auth';
import {Download, Trash2, Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {useAuth} from '@/contexts/AuthContext';
import {auth} from '@/lib/firebase';
import {exportAccount, requestAccountDeletion} from '@/services/accountPrivacyClient';
import {clearAccountOfflineData} from '@/utils/offlineStorage';
import {toast} from 'sonner';

export function EnhancedDataManagementSettings() {
  const {user, logout} = useAuth(), navigate = useNavigate();
  const [action,setAction] = useState<'export' | 'delete' | null>(null);
  const [password,setPassword] = useState(''), [confirmation,setConfirmation] = useState('');
  const [busy,setBusy] = useState(false), [error,setError] = useState<string | null>(null), [download,setDownload] = useState<string | null>(null);
  const running = useRef(false);
  const passwordAccount = auth.currentUser?.providerData.some(p => p.providerId === 'password');
  const googleAccount = auth.currentUser?.providerData.some(p => p.providerId === 'google.com');
  useEffect(() => {
    const open = () => {if (!running.current) setAction('export');};
    window.addEventListener('nova:export-data',open); return () => window.removeEventListener('nova:export-data',open);
  }, []);
  const close = () => {if (!running.current) {setAction(null);setPassword('');setConfirmation('');setError(null);}};
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !action || running.current || (action === 'delete' && confirmation !== 'DELETE')) return;
    running.current=true; setBusy(true); setError(null);
    try {
      const current=auth.currentUser;
      if (!current || current.uid !== user.uid) throw new Error('Sign in again to continue.');
      if (passwordAccount && current.email) await reauthenticateWithCredential(current,EmailAuthProvider.credential(current.email,password));
      else if (googleAccount) await reauthenticateWithPopup(current,new GoogleAuthProvider());
      setPassword('');
      if (action === 'export') {setDownload(await exportAccount());setAction(null);}
      else {
        const receipt=await requestAccountDeletion();
        await clearAccountOfflineData(user.uid).catch(() => toast.error('Account deletion recorded. Clear this browser’s site data to remove its offline cache.'));
        await logout();
        navigate(`/login?deletion=requested&receipt=${encodeURIComponent(receipt)}`, {replace:true});
      }
    } catch (err) {setError(err instanceof Error ? err.message : 'Please try again.');}
    finally {running.current=false;setBusy(false);}
  };
  return <div className="space-y-6">
    <section className="workspace-panel p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-semibold">Download your account data</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">Download saved memories, conversations, reminders, preferences, connected-agent metadata, and original uploaded files in one compressed JSON archive. Credentials are excluded.</p>
      <p className="text-xs leading-relaxed text-muted-foreground">Large accounts can take several minutes. Keep this page open and avoid editing until the archive is ready. The download link lasts 15 minutes; the archive is removed from our server within 24 hours plus the next cleanup run.</p>
      <Button onClick={() => {setError(null);setAction('export');}}><Download className="mr-2 h-4 w-4" />Prepare account export</Button>
      {download && <div role="status" className="rounded-xl border border-primary/30 bg-primary/5 p-4"><p className="mb-3 text-sm">Your archive is ready. Decompress the .gz file to read the JSON; original files are included as base64 content.</p><a href={download} download className="text-sm font-medium text-primary underline">Download account archive</a></div>}
      <p className="text-xs text-muted-foreground">Provider security logs, legally retained billing records, and unsynced data on other devices are outside this export.</p>
    </section>
    <section className="workspace-panel p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-semibold">Delete your account</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">This permanently deletes your saved memories, uploaded files, conversations, derived data, and account. Connected access is revoked and any active subscription is canceled. Download anything you want to keep first.</p>
      <Button variant="destructive" onClick={() => {setError(null);setAction('delete');}}><Trash2 className="mr-2 h-4 w-4" />Delete account</Button>
      <p className="text-xs leading-relaxed text-muted-foreground">You will be signed out when the request is recorded. Cleanup usually completes within 15 minutes and retries automatically if interrupted. A minimal deletion receipt is retained for 30 days. Provider records subject to legal retention remain with those providers.</p>
    </section>
    <Dialog open={!!action} onOpenChange={open => {if (!open) close();}}>
      <DialogContent className="workspace-shell max-w-md" onEscapeKeyDown={e => {if(busy) e.preventDefault();}} onPointerDownOutside={e => {if(busy) e.preventDefault();}}>
        <DialogHeader><DialogTitle>{action === 'delete' ? 'Permanently delete your account?' : 'Confirm your account export'}</DialogTitle><DialogDescription>{action === 'delete' ? 'This cannot be undone. Your subscription will be canceled and account access will stop as soon as the request is recorded.' : 'Confirm it’s you before downloading your private account data.'}</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {passwordAccount && <div className="space-y-2"><Label htmlFor="privacy-password">Current password</Label><Input id="privacy-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} /></div>}
          {googleAccount && <p className="text-sm text-muted-foreground">Continue to confirm with your Google account.</p>}
          {action === 'delete' && <div className="space-y-2"><Label htmlFor="delete-confirmation">Type DELETE to confirm</Label><Input id="delete-confirmation" autoComplete="off" value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy} /></div>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={close}>Cancel</Button><Button type="submit" variant={action === 'delete' ? 'destructive' : 'default'} disabled={busy || (action === 'delete' && confirmation !== 'DELETE')}>{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{action === 'export' ? 'Preparing…' : 'Recording…'}</> : action === 'delete' ? 'Delete my account' : 'Prepare export'}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}
