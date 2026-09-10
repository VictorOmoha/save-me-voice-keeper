import {beforeEach,afterEach,describe,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({user:{uid:'alice',getIdToken:vi.fn()},auth:{currentUser:null as unknown},getBlob:vi.fn(),fetch:vi.fn()}));
vi.mock('@/lib/firebase',()=>({auth:m.auth,storage:{}}));
vi.mock('firebase/storage',()=>({getBlob:m.getBlob,ref:(_storage:unknown,path:string)=>path}));
vi.mock('@/utils/cloudFunctions',()=>({getCloudFunctionUrl:(path:string)=>'https://example.test/'+path}));
import {exportAccount} from './accountPrivacyClient';
beforeEach(()=>{
  vi.clearAllMocks();m.auth.currentUser=m.user;m.user.getIdToken.mockResolvedValue('synthetic-token');
  vi.stubGlobal('fetch',m.fetch);vi.stubGlobal('URL',class extends URL {static createObjectURL=vi.fn().mockReturnValue('blob:private-export');});
  m.fetch.mockResolvedValue({ok:true,json:async()=>({storagePath:'account-exports/alice/archive.json.gz'})});
  m.getBlob.mockResolvedValue(new Blob(['archive']));
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('Private account archive downloads',()=>{
  it('fetches the owned archive with authenticated Storage and produces a local download',async()=>{
    expect(await exportAccount()).toBe('blob:private-export');
    expect(m.getBlob).toHaveBeenCalledWith('account-exports/alice/archive.json.gz');
  });
  it.each(['account-exports/bob/archive.json.gz','account-exports/alice/../bob/archive.json.gz'])('rejects an unexpected server path %s',async storagePath=>{
    m.fetch.mockResolvedValue({ok:true,json:async()=>({storagePath})});
    await expect(exportAccount()).rejects.toThrow('invalid');expect(m.getBlob).not.toHaveBeenCalled();
  });
  it('does not retain an archive if the account changes during download',async()=>{
    m.getBlob.mockImplementation(async()=>{m.auth.currentUser=null;return new Blob(['archive']);});
    await expect(exportAccount()).rejects.toThrow('Sign in');expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
