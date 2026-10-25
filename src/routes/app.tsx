import {createFileRoute} from '@tanstack/react-router';
import {meta} from '@/components/Brand';
import {LiveWorkspace} from '@/components/LiveWorkspace';
export const Route=createFileRoute('/app')({ssr:false,head:()=>({meta:meta('Your workspace — CoHost','Bring your clubs, resources, and people together.')}),component:LiveWorkspace});
