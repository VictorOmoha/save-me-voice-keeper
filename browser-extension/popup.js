'use strict';
const ORIGIN='https://saveme.space';
const send=(message)=>chrome.runtime.sendMessage(message);
const $=(id)=>document.getElementById(id);
let connected=false,predictTimer;
document.addEventListener('DOMContentLoaded',async()=>{wire();await renderStatus();await prefill();});
function wire(){
  $('saveBtn').addEventListener('click',save);
  $('openBtn').addEventListener('click',()=>chrome.tabs.create({url:`${ORIGIN}/dashboard`}));
  $('loginBtn').textContent='Connect securely'; $('loginBtn').addEventListener('click',connect);
  $('novaBtn').addEventListener('click',()=>send({action:'open-brain-dump'}));
  $('authBadge').addEventListener('click',async()=>{if(connected){const action=confirm('OK: sign out. Cancel: switch account.');await send({action:action?'sign-out':'switch-account'});await renderStatus();}});
  $('titleInput').addEventListener('input',schedulePredict); $('contentInput').addEventListener('input',schedulePredict);
}
async function renderStatus(){const s=await send({action:'get-status'});connected=Boolean(s.success&&s.connected);$('authDot').className=`dot ${connected?'green':'gray'}`;$('authLabel').textContent=connected?`Connected: ${s.account?.email||'account'}`:'Not connected';$('authBadge').className=`auth-badge ${connected?'logged-in':'logged-out'}`;$('saveForm').style.display=connected?'block':'none';$('authRequired').style.display=connected?'none':'block';}
async function connect(){const code=prompt('Open SaveMe.Space Settings, generate a one-time code, then enter it here.');if(!code){await send({action:'open-connect'});return;}const r=await send({action:'pair',code});if(!r.success){feedback('error','Connection failed',r.error==='invalid_or_expired_code'?'Code expired, was already used, or is incorrect. Generate a new code.':'Check the code format and try again.');return;}await renderStatus();feedback('success','Connected',`Paired with ${r.account?.email||'your account'}`);}
async function prefill(){if(!connected)return;const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab)return;$('titleInput').value=tab.title||'';window._pageUrl=tab.url||'';window._pageTitle=tab.title||'';schedulePredict();}
function schedulePredict(){clearTimeout(predictTimer);predictTimer=setTimeout(async()=>{if(!connected)return;const r=await send({action:'predict-category',title:$('titleInput').value,content:$('contentInput').value,url:window._pageUrl||'',pageTitle:window._pageTitle||''});if(r.success){$('categoryName').textContent=r.category||'Personal';$('categoryNovaTag').style.display=r.categoryPredicted?'inline':'none';}},600);}
async function save(){if(!connected)return;$('saveBtn').disabled=true;const title=$('titleInput').value.trim()||window._pageTitle||'Saved from web';const r=await send({action:'quick-save',title,content:$('contentInput').value.trim(),url:window._pageUrl||'',pageTitle:window._pageTitle||''});$('saveBtn').disabled=false;if(!r.success){if(['not_authenticated','credential_revoked_or_expired'].includes(r.error))await renderStatus();feedback('error','Save failed',r.error==='network_error'?'Check your connection':'Reconnect and try again');return;}feedback('success','Saved to vault',`${title.slice(0,40)} → ${r.category||'Personal'}`);}
function feedback(type,title,sub){$('feedback').className=`feedback ${type}`;$('feedbackTitle').textContent=title;$('feedbackSub').textContent=sub;$('feedback').style.display='block';}
