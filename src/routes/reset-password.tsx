import {createFileRoute,Link} from '@tanstack/react-router';
import {useEffect,useState} from 'react';
import {Brand,meta} from '@/components/Brand';
import {getSupabase} from '@/lib/supabase';
import {finishAuthReturn} from '@/lib/auth-return';
export const Route=createFileRoute('/reset-password')({ssr:false,head:()=>({meta:meta('Reset password — CoHost','Choose a new password for your account.')}),component:Reset});
export function Reset(){
 const [ready,setReady]=useState(false),[checking,setChecking]=useState(true),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{let active=true;void finishAuthReturn().then(r=>{if(!active)return;setReady(r.ok&&r.recovery);setMessage(!r.ok?r.message:!r.recovery?'Use the password-reset link from your email to choose a new password.':'');setChecking(false)});return()=>{active=false}},[]);
 return <div className="mx-auto max-w-md space-y-8 px-6 py-12"><Link to="/"><Brand/></Link><section className="panel space-y-5"><h1 className="text-2xl font-bold">{checking?'Checking your reset link…':done?'Your password is updated.':'Choose a new password'}</h1>{checking?<p role="status" className="text-sm text-muted-foreground">Verifying your secure recovery session.</p>:done?<><p role="status" className="text-sm leading-7 text-muted-foreground">Sign in with your new password. Previous sessions have been signed out.</p><Link to="/auth" className="btn btn-primary">Back to sign in</Link></>:ready?<form className="space-y-4" onSubmit={async e=>{
  e.preventDefault();if(busy)return;const f=new FormData(e.currentTarget),pw=String(f.get('password')??'');
  if(pw.length<8||pw.length>72)return setMessage('Use 8–72 characters.');
  if(pw!==f.get('confirm'))return setMessage('Your passwords do not match.');
  const sb=getSupabase();if(!sb)return setMessage('Authentication is unavailable.');
  setBusy(true);setMessage('');
  try{const r=await sb.auth.updateUser({password:pw});if(r.error)throw r.error;const out=await sb.auth.signOut({scope:'global'});if(out.error)throw out.error;setReady(false);setDone(true)}catch(err){setMessage((err as Error).message||'Password update failed. Request a new link.')}finally{setBusy(false)}
 }}><label className="block text-sm font-medium">New password<input name="password" type="password" autoComplete="new-password" className="field mt-2" minLength={8} maxLength={72} required/></label><label className="block text-sm font-medium">Confirm new password<input name="confirm" type="password" autoComplete="new-password" className="field mt-2" minLength={8} maxLength={72} required/></label><button className="btn btn-primary w-full" disabled={busy}>{busy?'Updating password…':'Update password'}</button></form>:<Link to="/auth" className="btn btn-primary">Request a new reset link</Link>}{message&&<p role="alert" className="text-sm leading-7 text-muted-foreground">{message}</p>}</section></div>;
}
