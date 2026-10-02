/** Real local file reopen. Uses the shared contract; no clock or story phase can complete it. */
import {createStore, initialState} from './motion-contract.mjs';
import {decodeDraft, DraftError, MAX_FILE_BYTES} from './sample-draft.mjs';
export function createDraftReopen({apply,readback,onState=()=>{}}){
 let generation=0,current=null;
 const terminal=new Set(['idle','done','cancelled','error']);
 function cancel(){
  const target=current;
  if(!target||terminal.has(target.store.getState().phase)||target.cancelling||target.store.getState().cancelRequested)return;
  target.cancelling=true;generation++;
  try{target.send('CANCEL_REQUESTED');target.send('CANCEL_CONFIRMED',{confirmationId:`cancel-${target.store.getState().operationId}`});}
  finally{target.cancelling=false;}
 }
 async function open(file,{product,language,isCurrent=()=>true}){
  cancel();const token=++generation,operationId=`reopen-${token}`;const store=createStore(operationId);let seq=0;
  const send=(type,payload={})=>store.dispatch({type,payload,operationId,id:`${operationId}-${++seq}`,seq});current={store,send};store.subscribe((state,event)=>{if(current?.store===store)onState(state,event);});onState(store.getState());
  const requestId=operationId+'-read',receiptId=operationId+'-bytes';
  send('DRAFT_READY',{draft:{id:operationId+'-selection',summary:'Reopen the selected local Markdown file'},approvalRequired:false});send('EXECUTION_STARTED',{requestId});
  const stale=()=>token!==generation||!isCurrent();
  try{
   if(stale()||store.getState().phase==='cancelled'){if(current?.store===store)cancel();return {status:'cancelled'};}
   if(file.size>MAX_FILE_BYTES)throw new DraftError('TOO_LARGE');
   const bytes=new Uint8Array(await file.arrayBuffer());if(stale()){if(current?.store===store)cancel();return {status:'cancelled'};}
   send('EXECUTION_RECEIPT',{requestId,receiptId});const restored=decodeDraft(bytes);
   if(restored.product!==product||restored.language!==language)throw new DraftError('MISMATCH');
   if(stale()){if(current?.store===store)cancel();return {status:'cancelled'};}
   apply(restored);const applied=readback(product);
   if(stale()||store.getState().phase==='cancelled'){if(current?.store===store)cancel();return {status:'cancelled'};}
   if(applied!==restored.text)throw new DraftError('APPLY_MISMATCH');
   send('VERIFICATION_PASSED',{receiptId,evidence:{id:operationId+'-accepted',verified:true,summary:'Local file validated and text matched in this tab',source:'Selected Markdown file → current tab draft'}});
   return {status:'done',draft:restored,state:store.getState()};
  }catch(error){if(stale()){if(current?.store===store)cancel();return {status:'cancelled'};}const failure=error instanceof DraftError?error:new DraftError('READ_FAILED');send('FAILED',{reason:failure.code});return {status:'error',error:failure,state:store.getState()};}
 }
 function reset(){cancel();generation++;current=null;onState(initialState(`reopen-reset-${generation}`));}
 return {open,cancel,reset,state:()=>current?.store.getState()??null};
}
export function operationText(state,language='en'){
 const ja=language==='ja';const labels={idle:ja?'文章を準備':'Prepare your text',review:ja?'選んだファイルを確認':'Selected file ready',running:ja?'ファイルを読み込み中':'Reading the local file',verifying:ja?'形式・製品・言語を確認':'Validating file, product, and language',done:ja?'読み戻した文章を確認済み':'Restored text checked in this tab',cancelled:ja?'読み戻しを取り消しました':'Reopen cancelled',error:ja?'読み戻せませんでした':'Could not reopen the file'};
 return labels[state?.phase]??(ja?'確認が必要':'Review needed');
}
