import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { apiFetch } from './api';
import { useAssistant } from './useAssistant';
vi.mock('./api', () => ({apiFetch:vi.fn()}));
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
const api = vi.mocked(apiFetch);
const answer = {requestId:'a',cycle:'2025',sections:[{text:'Answer',sourceIds:[]}],programs:[],sources:[],milestones:[]};
let root:Root,host:HTMLDivElement,current:ReturnType<typeof useAssistant>;
function Probe({token='one'}:{token?:string}) {current=useAssistant(token,{view:'roadmap',route:'all'});return null;}
beforeEach(()=>{api.mockReset();api.mockResolvedValue({enabled:true});host=document.createElement('div');root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());});
it('ignores late responses after cancellation and restores draft',async()=>{
 await act(async()=>root.render(<Probe/>));
 let resolve!:(v:any)=>void;api.mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));
 let pending!:Promise<void>;act(()=>{pending=current.send('Question');});
 act(()=>current.cancel());expect(current.draft).toBe('Question');
 await act(async()=>{resolve(answer);await pending;});expect(current.turns).toHaveLength(0);
});
it('clears history and rejects pending responses when account changes',async()=>{
 await act(async()=>root.render(<Probe/>));api.mockResolvedValueOnce(answer);
 await act(async()=>current.send('First'));expect(current.turns).toHaveLength(1);
 let resolve!:(v:any)=>void;api.mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));
 let pending!:Promise<void>;act(()=>{pending=current.send('Second');});
 await act(async()=>root.render(<Probe token='two'/>));
 await act(async()=>{resolve(answer);await pending;});expect(current.turns).toHaveLength(0);expect(current.pending).toBe('');
});
it('supports retry and reset, sending bounded history and auth token',async()=>{
 await act(async()=>root.render(<Probe/>));api.mockRejectedValueOnce(new Error('Quota'));
 await act(async()=>current.send('Question'));expect(current.retryQuestion).toBe('Question');
 api.mockResolvedValueOnce(answer);await act(async()=>current.send(current.retryQuestion));
 expect(current.turns).toHaveLength(1);expect(api.mock.calls.at(-1)?.[2]).toBe('one');
 act(()=>current.reset());expect(current.turns).toHaveLength(0);expect(current.error).toBe('');
});
