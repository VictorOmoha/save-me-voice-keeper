import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import type * as functions from 'firebase-functions';
const m=vi.hoisted(()=>({verify:vi.fn(),create:vi.fn(),retrieve:vi.fn(),firestore:vi.fn()}));
vi.mock('firebase-functions',()=>({https:{onRequest:(h:unknown)=>h}}));
vi.mock('../common/http',()=>({withCors:(h:unknown)=>h}));
vi.mock('../common/auth',()=>({verifyAuth:m.verify}));
vi.mock('firebase-admin',()=>({firestore:m.firestore}));
vi.mock('./stripeClient',()=>({getStripeClient:()=>({customers:{retrieve:m.retrieve},checkout:{sessions:{create:m.create}}})}));
import {createCheckout} from './functions';
beforeEach(()=>{
  vi.clearAllMocks();vi.stubEnv('STRIPE_MODE','test');vi.stubEnv('STRIPE_TEST_BASIC_MONTHLY_PRICE_ID','price_basic');vi.stubEnv('STRIPE_TEST_PREMIUM_MONTHLY_PRICE_ID','price_premium');
  m.verify.mockResolvedValue({uid:'alice'});m.retrieve.mockResolvedValue({id:'cus_alice',metadata:{firebaseUserId:'alice'}});
  m.firestore.mockReturnValue({collection:()=>({doc:()=>({get:async()=>({data:()=>({stripeCustomerId:'cus_alice'})})})})});
  m.create.mockResolvedValue({id:'cs_test',url:'https://checkout.stripe.com/test'});
});
afterEach(()=>vi.unstubAllEnvs());
it('creates card subscription checkout with the server price and trusted return URLs',async()=>{
  const res={status:vi.fn().mockReturnThis(),json:vi.fn()};
  await createCheckout({method:'POST',headers:{origin:'https://attacker.invalid'},body:{plan:'basic',priceId:'price_attacker',uid:'bob'}} as functions.https.Request,res as unknown as functions.Response);
  expect(m.create).toHaveBeenCalledWith(expect.objectContaining({payment_method_types:['card'],mode:'subscription',customer:'cus_alice',line_items:[{price:'price_basic',quantity:1}],client_reference_id:'alice',cancel_url:'https://saveme.space/subscription'}));
  expect(res.json).toHaveBeenCalledWith({sessionId:'cs_test',url:'https://checkout.stripe.com/test'});
});
