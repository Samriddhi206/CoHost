import {getSupabase} from './supabase';
export type AuthReturn={ok:true;recovery:boolean}|{ok:false;message:string};
const invalid='This email link has expired, was already used, or was opened in a different browser. If you already confirmed your email, return to sign in with your password. Otherwise request a new link.';
export function readAuthCode(href:string):string|null{
 const u=new URL(href);
 if(u.searchParams.has('error')||new URLSearchParams(u.hash.slice(1)).has('error'))return null;
 const code=u.searchParams.get('code');
 return code&&code.length<=2048?code:null;
}
let pending:Promise<AuthReturn>|undefined;
/** One exchange per page lifetime; removes the authorization code from browser history. */
export function finishAuthReturn():Promise<AuthReturn>{
 if(pending)return pending;
 const code=readAuthCode(window.location.href);
 const url=new URL(window.location.href);
 const flowId=url.searchParams.get('sb_flow_id');
 // Confirmation tokens in the fragment work across browsers and never reach server logs.
 const fragment=new URLSearchParams(url.hash.slice(1));
 const token=fragment.get('token_hash');
 const emailToken=url.pathname==='/auth/callback'&&fragment.get('type')==='email'&&token&&/^[a-f0-9]{40,128}$/i.test(token)&&!url.searchParams.has('error')&&!fragment.has('error')?token:null;
 window.history.replaceState(window.history.state,'',window.location.pathname);
 const sb=getSupabase();
 pending=(async()=>{
  if((!code&&!emailToken)||!sb)return {ok:false,message:invalid} as const;
  let recovery=false;
  const {data:listener}=sb.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')recovery=true});
  try{
   // Preserve Supabase's per-flow verifier selector before sanitizing browser history.
   const {data,error}=emailToken?await sb.auth.verifyOtp({token_hash:emailToken,type:'email'}):await sb.auth.exchangeCodeForSession(code!,flowId?{flowId}:undefined);
   if(error||!data.session)return {ok:false,message:invalid} as const;
   const verified=await sb.auth.getUser();
   if(verified.error||!verified.data.user?.email_confirmed_at)return {ok:false,message:'Your email could not be verified. Please request a new confirmation link.'} as const;
   return {ok:true,recovery:emailToken?false:recovery} as const;
  }catch{return {ok:false,message:'Unable to verify this link. Check your connection and request a new link.'} as const}
  finally{listener.subscription.unsubscribe()}
 })();
 return pending;
}
