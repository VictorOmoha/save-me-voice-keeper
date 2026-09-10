import {describe, expect, it} from 'vitest';
import {base64Chunks, exportSafeValue, safeAccountUid} from './accountResources';
describe('Account portability boundaries', () => {
  it('round trips binary files across arbitrary stream chunk boundaries', async () => {
    const original=Buffer.from(Array.from({length:513},(_,i)=>i%256));
    async function* source() {for(let i=0;i<original.length;i+=7) yield original.subarray(i,i+7);}
    let encoded=''; for await (const chunk of base64Chunks(source())) encoded+=chunk;
    expect(Buffer.from(encoded,'base64')).toEqual(original);
  });
  it('excludes nested snake_case and camelCase credentials while retaining useful metadata', () => {
    expect(exportSafeValue({notes:'Keep this',key_prefix:'sm_123',refreshTokenHash:'secret',settings:{elevenlabs_api_key:'secret',privateKey:'secret',voice:'nova'},createdAt:{toDate:()=>new Date('2026-09-10T00:00:00Z')}})).toEqual({notes:'Keep this',key_prefix:'sm_123',settings:{voice:'nova'},createdAt:'2026-09-10T00:00:00.000Z'});
  });
  it.each(['','../another-user','foo/bar','foo\\bar','..'])('rejects unsafe storage ownership path %s', uid => {expect(()=>safeAccountUid(uid)).toThrow();});
});
