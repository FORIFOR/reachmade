/** Motion is a projection of evidence, never its source. No clocks or timers here. */
export const phases = Object.freeze(['idle','listening','review','awaiting_approval','running','verifying','done','blocked','error','cancelled']);
export const tokens = Object.freeze({motion:{micro:120,change:220,reshape:420,maxTravel:24},radius:{control:12,surface:24,pill:999},space:[4,8,12,16,24,32,48,64],minTarget:44});
const terminal = new Set(['done','cancelled']);
const accepted = Object.freeze({
  INPUT_STARTED:['idle'], DRAFT_READY:['idle','listening'], APPROVAL_REQUESTED:['review'],
  APPROVED:['awaiting_approval'], EXECUTION_STARTED:['review','awaiting_approval'],
  EXECUTION_RECEIPT:['running'], VERIFICATION_PASSED:['verifying'],
  BLOCKED:['listening','review','awaiting_approval','running','verifying'],
  FAILED:['listening','review','awaiting_approval','running','verifying','blocked'],
  CANCEL_REQUESTED:['listening','review','awaiting_approval','running','verifying','blocked'],
  CANCEL_CONFIRMED:['listening','review','awaiting_approval','running','verifying','blocked'],
});
export function initialState(operationId='initial') { return Object.freeze({phase:'idle',operationId,seq:0,seen:[],draft:null,approval:null,approvalRequired:false,receipt:null,evidence:null,cancelRequested:false,message:'Ready'}); }
export function transition(state,event) {
  if (!event || typeof event.id!=='string' || !event.id || typeof event.operationId!=='string' || !Number.isSafeInteger(event.seq) || event.seq < 1) throw new TypeError('Event requires id, operationId and positive integer seq');
  if(event.type==='RESET') {
    if(event.operationId===state.operationId) return state;
    return initialState(event.operationId);
  }
  if(event.operationId!==state.operationId || event.seq<=state.seq || state.seen.includes(event.id) || terminal.has(state.phase)) return state;
  if(!accepted[event.type]?.includes(state.phase)) return state;
  let next={...state,seq:event.seq,seen:[...state.seen,event.id].slice(-256)};
  const p=event.payload ?? {};
  switch(event.type){
    case 'INPUT_STARTED': next.phase='listening'; next.message=p.message??'Receiving input'; break;
    case 'DRAFT_READY': if(!p.draft?.id || !p.draft?.summary) return state; next.phase='review'; next.draft=p.draft; next.approvalRequired=Boolean(p.approvalRequired); next.message='Draft ready to review'; break;
    case 'APPROVAL_REQUESTED': if(!state.draft) return state; next.phase='awaiting_approval'; next.approvalRequired=true; next.message='Your approval is needed'; break;
    case 'APPROVED': if(p.draftId!==state.draft?.id || !p.approvalId) return state; next.approval={id:p.approvalId,draftId:p.draftId}; next.message='Approved; waiting to start'; break;
    case 'EXECUTION_STARTED': if(state.cancelRequested || (state.approvalRequired&&!state.approval) || !p.requestId) return state; next.phase='running'; next.requestId=p.requestId; next.message='Working'; break;
    case 'EXECUTION_RECEIPT': if(p.requestId!==state.requestId || !p.receiptId) return state; next.phase='verifying'; next.receipt={id:p.receiptId,requestId:p.requestId}; next.message='Result received; checking it'; break;
    case 'VERIFICATION_PASSED': if(p.receiptId!==state.receipt?.id || !p.evidence?.id || !p.evidence?.summary || !p.evidence?.source || p.evidence?.verified!==true) return state; next.phase='done'; next.evidence=p.evidence; next.message=p.evidence.summary; break;
    case 'BLOCKED': if(!p.reason) return state; next.phase='blocked'; next.message=p.reason; break;
    case 'FAILED': if(!p.reason) return state; next.phase='error'; next.message=p.reason; break;
    case 'CANCEL_REQUESTED': next.cancelRequested=true; next.message='Cancellation requested; waiting for confirmation'; break;
    case 'CANCEL_CONFIRMED': if(!p.confirmationId) return state; next.phase='cancelled'; next.message='Cancelled'; break;
  }
  return Object.freeze(next);
}
export function createStore(operationId){
  let state=initialState(operationId); const listeners=new Set();
  return {getState:()=>state, dispatch(event){const next=transition(state,event); if(next!==state){state=next; for(const listener of listeners)listener(state,event);} return state;},subscribe(fn){listeners.add(fn); return ()=>listeners.delete(fn);}};
}
export function present(state){return {phase:state.phase,label:state.message,busy:['running','verifying'].includes(state.phase),approvalNeeded:state.phase==='awaiting_approval'&&!state.approval,complete:state.phase==='done'&&Boolean(state.evidence),canCancel:!['idle','done','cancelled','error'].includes(state.phase),progress:null};}
/** A local renderer may announce state changes, but never move keyboard focus automatically. */
export function bindStatus(store,{surface,status}){
  const render=state=>{const p=present(state); surface.dataset.phase=p.phase; surface.setAttribute('aria-busy',String(p.busy)); if(status.textContent!==p.label) status.textContent=p.label;};
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');render(store.getState());return store.subscribe(render);
}
