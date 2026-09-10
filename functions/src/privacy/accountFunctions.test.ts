import {beforeEach,describe,expect,it,vi} from 'vitest';
import type * as functions from 'firebase-functions';
const m=vi.hoisted(()=>({auth:vi.fn(),firestore:vi.fn(),verify:vi.fn()}));
vi.mock('firebase-functions',()=>{
  const builder={https:{onRequest:(h:unknown)=>h},firestore:{document:()=>({onCreate:(h:unknown)=>h})},pubsub:{schedule:()=>({onRun:(h:unknown)=>h})}};
  return {...builder,runWith:()=>builder};
});
vi.mock('firebase-admin',()=>({auth:m.auth,firestore:m.firestore}));
vi.mock('../common/auth',()=>({verifyAuth:m.verify}));
vi.mock('../common/http',()=>({withCors:(h:unknown)=>h}));
vi.mock('../common/abuseControl',()=>({enforceAbuseControls:vi.fn(),sendAbuseError:()=>false}));
import {accountDelete,accountExport} from './accountFunctions';
const create=vi.fn(), disable=vi.fn(), revoke=vi.fn(), paths:string[]=[];
async function request(handler:typeof accountDelete, body={}) {
  const res={status:vi.fn().mockReturnThis(),set:vi.fn(),json:vi.fn()};
  await handler({method:'POST',body} as functions.https.Request,res as unknown as functions.Response); return res;
}
beforeEach(()=>{
  vi.clearAllMocks();paths.length=0;
  m.verify.mockResolvedValue({uid:'alice',auth_time:Math.floor(Date.now()/1000)});
  m.auth.mockReturnValue({updateUser:disable.mockResolvedValue(undefined),revokeRefreshTokens:revoke.mockResolvedValue(undefined)});
  m.firestore.mockReturnValue({collection:(name:string)=>({doc:(uid:string)=>{paths.push(`${name}/${uid}`);return {get:async()=>({exists:false}),create};}})});
});
describe('Account HTTP authorization',()=>{
  it.each([accountExport,accountDelete])('rejects an unauthenticated request before reading data',async handler=>{
    m.verify.mockResolvedValue(null);expect((await request(handler)).status).toHaveBeenCalledWith(401);expect(m.firestore).not.toHaveBeenCalled();
  });
  it.each([accountExport,accountDelete])('requires recent authentication',async handler=>{
    m.verify.mockResolvedValue({uid:'alice',auth_time:0});expect((await request(handler)).status).toHaveBeenCalledWith(401);expect(create).not.toHaveBeenCalled();
  });
  it('requires the explicit deletion confirmation',async()=>{
    expect((await request(accountDelete)).status).toHaveBeenCalledWith(400);expect(create).not.toHaveBeenCalled();expect(disable).not.toHaveBeenCalled();
  });
  it('ignores supplied ownership and records only the authenticated account',async()=>{
    const res=await request(accountDelete,{confirmation:'DELETE',uid:'bob',ownerUid:'bob'});
    expect(paths.every(path=>path==='account_deletions/alice')).toBe(true);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({status:'pending',finalizeAfter:expect.any(Number)}));
    expect(disable).toHaveBeenCalledWith('alice',{disabled:true});expect(revoke).toHaveBeenCalledWith('alice');
    expect(res.status).toHaveBeenCalledWith(202);
  });
});
