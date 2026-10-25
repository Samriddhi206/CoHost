import {createFileRoute,Link} from '@tanstack/react-router';
import {useEffect,useState} from 'react';
import {Brand,meta} from '@/components/Brand';
import {finishAuthReturn,type AuthReturn} from '@/lib/auth-return';
export const Route=createFileRoute('/auth_/callback')({ssr:false,head:()=>({meta:meta('Confirm your email — CoHost','Verify your CoHost email link.')}),component:Callback});
function Callback(){
 const [result,setResult]=useState<AuthReturn|null>(null);
 useEffect(()=>{let active=true;void finishAuthReturn().then(r=>{if(active)setResult(r)});return()=>{active=false}},[]);
 return <div className="mx-auto max-w-lg space-y-8 px-6 py-12"><Brand/><section className="panel space-y-5"><h1 className="text-2xl font-bold">{!result?'Confirming your email…':result.ok?'You’re confirmed. Welcome to CoHost.':'This link couldn’t be verified'}</h1>{result&&!result.ok?<><p role="alert" className="text-sm leading-7 text-muted-foreground">{result.message}</p><Link to="/auth" className="btn btn-primary">Return to sign in</Link></>:result?.ok?<><p className="text-sm leading-7 text-muted-foreground">Your email is verified and you’re signed in. Your campus is waiting.</p><Link to="/app" className="btn btn-primary">Open my workspace</Link></>:<p role="status" className="text-sm text-muted-foreground">Verifying your secure email link.</p>}</section></div>;
}
