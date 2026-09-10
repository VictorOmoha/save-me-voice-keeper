import {afterEach,describe,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({getBlob:vi.fn()}));
vi.mock('@/lib/firebase',()=>({storage:{},auth:{currentUser:null}}));
vi.mock('firebase/storage',()=>({ref:(_:unknown,path:string)=>path,getBlob:m.getBlob}));
import {downloadDocumentBlob} from '../documentStorage';
afterEach(()=>{vi.useRealTimers();vi.clearAllMocks();});
describe('Document download recovery',()=>{
  it('returns the original bytes',async()=>{const blob=new Blob(['original']);m.getBlob.mockResolvedValue(blob);expect(await downloadDocumentBlob('documents/alice/file')).toBe(blob);});
  it('rejects a stalled request so the viewer can offer a retry',async()=>{
    vi.useFakeTimers();m.getBlob.mockReturnValue(new Promise(()=>{}));
    const assertion=expect(downloadDocumentBlob('documents/alice/file')).rejects.toThrow('download timed out');
    await vi.advanceTimersByTimeAsync(30_001);await assertion;
  });
});
