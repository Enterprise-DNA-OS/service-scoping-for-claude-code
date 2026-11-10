#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash,randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { getDb,REPO_ROOT } from './lib/db.mjs';
import { table } from './lib/format.mjs';
import { parseCsv } from './lib/csv.mjs';
export const reads={
 clients:'select code,name,contact,purpose,review_due from clients order by code',
 services:'select code,name,phase,resource,hours,currency,cost_cents,sell_cents,state,reviewed_on from services order by code',
 scopes:'select code,name,client,owner,status,revision,due,currency,hours,revenue_cents from scope_totals order by due,code',
 attention:'select * from attention order by due,reference,issue',
 'margin-watch':"select code,name,currency,hours,cost_cents,revenue_cents,margin_percent,minimum_margin,unpriced from margin_board where status<>'closed' order by code",
 'assumptions-due':'select a.code,s.code as scope,a.name,a.owner,a.due,a.resolved_on,a.evidence from assumptions a join scopes s on s.id=a.scope_id order by a.due,a.code',
 'approvals-due':"select code,name,owner,revision,due,signoffs from scope_totals where status='pending' order by due,code",
 'catalogue-drift':'select s.code as scope,i.code as line,i.name,i.hours,i.quantity,i.resource from line_costs i join scopes s on s.id=i.scope_id where i.differs_from_catalogue order by s.code,i.code',
 'rates-review':"select code,name,resource,currency,cost_cents,sell_cents,reviewed_on from services where state<>'archived' and (reviewed_on is null or reviewed_on<current_date-90 or cost_cents is null or sell_cents is null) order by code",
 'effort-by-role':"select s.code as scope,i.phase,i.resource,sum(i.total_hours) as hours from line_costs i join scopes s on s.id=i.scope_id where s.status<>'closed' group by s.code,i.phase,i.resource order by s.code,i.phase,i.resource",
 compliance:'select * from compliance_findings order by reference,rule',
 activity:'select entity,entity_id,actor,action,created_at from activity order by created_at desc,id limit 100',
 stats:'select currency,status,count(*)::integer as scopes,sum(hours) as hours,count(*) filter(where unpriced>0)::integer as unpriced_scopes from scope_totals group by currency,status order by currency,status'
};
export const commands=[...Object.keys(reads),'scope','history','scenario','add-client','review-client','add-service','set-rate','create-scope','add-line','set-line','add-assumption','resolve-assumption','submit','approve','revise','close','log','draft-sow','weekly-review','import','export','help'];
const req=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`--${k}= is required`);return o[k].trim();};
const num=(v,label,max=100000)=>{if(v===undefined||v===''||!/^\d+(\.\d{1,2})?$/.test(String(v))||Number(v)>max)throw Error(`${label}: expected a nonnegative number with at most two decimals`);return Number(v);};
const cents=(v,label)=>{const n=num(v,label,2147483647);if(!Number.isInteger(n))throw Error(`${label}: use whole cents`);return n;};
const today=()=>new Date().toISOString().slice(0,10);
const date=(v)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Use a real YYYY-MM-DD date');return v;};
const currency=(v)=>{if(!['NZD','AUD','USD','EUR','GBP'].includes(v))throw Error('Unsupported currency');return v;};
export const format=(rows)=>table(rows,Object.keys(rows[0]||{}).map(key=>({key,label:key,width:70})));
export async function resolve(db,entity,term){
 if(!term)throw Error(`Specify ${entity} code, name or id prefix`);
 const rows=await db.query(`select id,code,name from ${entity} order by code`),q=term.toLowerCase();
 const exact=rows.filter(r=>r.code.toLowerCase()===q||r.id===q);
 const matches=exact.length?exact:rows.filter(r=>r.id.startsWith(q)||r.name.toLowerCase().includes(q));
 if(matches.length!==1)throw Error(`${matches.length?'Ambiguous':'Unknown'} ${entity}: ${term}\n${format(matches.length?matches:rows)}`);
 return matches[0];
}
async function tx(db,actor,fn,dry=false){await db.exec('BEGIN ISOLATION LEVEL SERIALIZABLE');try{await db.query("select set_config('app.actor',$1,true)",[actor]);const r=await fn();await db.exec(dry?'ROLLBACK':'COMMIT');return r;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function scope(db,term){const r=await resolve(db,'scopes',term);return (await db.query('select * from scopes where id=$1 for update',[r.id]))[0];}
async function editable(db,term){const s=await scope(db,term);if(s.status!=='draft')throw Error('Revise this scope before editing; only draft scopes can change');return s;}
async function bump(db,s){await db.query('update scopes set revision=revision+1 where id=$1',[s.id]);}
async function detail(db,term){const s=await resolve(db,'scopes',term);return {
 scope:await db.query('select * from margin_board where id=$1',[s.id]),
 lines:await db.query('select * from line_costs where scope_id=$1 order by phase,code',[s.id]),
 assumptions:await db.query('select code,name,owner,due,resolved_on,evidence from assumptions where scope_id=$1 order by code',[s.id])
};}
function privateWrite(file,data){fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});fs.writeFileSync(file,data,{mode:0o600,flag:'wx'});}
const newCode=(prefix)=>prefix+'-'+randomUUID().slice(0,12);
const nativeColumns=['Line of Business','Service Category','Service','Subservice','Phase','Resource','Suggested Hours','State','Service Type','Billing Frequency','Service Description'];
async function importServices(db,o){
 const rows=parseCsv(fs.readFileSync(req(o,'file'),'utf8'));if(!rows.length)throw Error('CSV has no service rows');
 const headers=Object.keys(rows[0]);for(const col of ['Line of Business','Service Category','Service','Subservice','Suggested Hours'])if(!headers.includes(col))throw Error(`Missing native column: ${col}`);
 let parent=null,parentKey=null;const seen=new Set(),out=[];
 for(const [idx,r] of rows.entries()){
  if(!r.Service.trim())throw Error(`Row ${idx+2}: missing Service`);
  if(r['Service Type']&&!/^(professional|professional service|professional services|ps)$/i.test(r['Service Type'].trim()))throw Error('Only professional service catalogues are supported; separate managed services first');
  if(r['Billing Frequency']&&!/^(one time|one-time|one_time|one time only)$/i.test(r['Billing Frequency'].trim()))throw Error('Recurring service prices are outside this labour-estimate importer');
  const base=[r['Line of Business'],r['Service Category'],r.Service];const key=JSON.stringify([...base,r.Subservice||'']);
  if(seen.has(key))throw Error(`Duplicate service path at row ${idx+2}`);seen.add(key);
  if(r.Subservice && (!parent||JSON.stringify(base)!==parentKey))throw Error(`Subservice row ${idx+2} must follow its matching parent`);
  const [existing]=await db.query('select * from services where source_key=$1',[key]);
  if(existing && existing.currency!==o.currency)throw Error('Currency differs from the previous import; review the mapping before changing currencies');
  const values={code:existing?.code||'SS-'+createHash('sha256').update(key).digest('hex').slice(0,16),name:r.Subservice||r.Service,parent_id:r.Subservice?parent:null,lob:base[0],category:base[1],phase:r.Phase||'',resource:r.Resource||'',hours:num(r['Suggested Hours']||'0','Suggested Hours'),currency:currency(req(o,'currency')),description:r['Service Description']||'',language:Object.fromEntries(headers.filter(k=>!nativeColumns.includes(k)).map(k=>[k,r[k]])),source_key:key,state:'pending',reviewed_on:null};
  // Vendor export does not document cost/sell rates. Existing manually reviewed rates remain;
  // changed service content always returns to pending and must be reviewed again.
  const cols=Object.keys(values),vals=Object.values(values).map(v=>typeof v==='object'&&v!==null?JSON.stringify(v):v);
  const [saved]=await db.query(`insert into services (${cols.join(',')}) values (${cols.map((_,i)=>'$'+(i+1)).join(',')}) on conflict(source_key) do update set ${cols.filter(k=>k!=='code').map(k=>k+'=excluded.'+k).join(',')} returning id,code`,vals);
  if(!r.Subservice){parent=saved.id;parentKey=JSON.stringify(base);}
  out.push({code:saved.code,name:values.name,status:'pending rate and content review'});
 }
 return out;
}
export async function run(db,command,args=[],o={}){
 if('dry-run' in o && o['dry-run']!==true)throw Error('Use --dry-run without a value');
 if(reads[command])return db.query(reads[command]);
 if(command==='help')return commands.map(command=>({command}));
 if(command==='scope')return detail(db,args[0]);
 if(command==='history'){const s=await resolve(db,'scopes',args[0]);return db.query('select sub.revision,sub.actor as submitted_by,sub.created_at,ap.kind,ap.actor as approver,ap.evidence,ap.exception_reason from submissions sub left join approvals ap on ap.submission_id=sub.id where sub.scope_id=$1 order by sub.revision,ap.kind',[s.id]);}
 if(command==='scenario'){
  const d=await detail(db,args[0]),extra=num(req(o,'extra-hours'),'extra-hours'),rate=cents(req(o,'cost-cents'),'cost-cents');const s=d.scope[0];
  if(s.unpriced||!s.line_count)throw Error('Price every line before testing a scenario');
  const cost=Number(s.cost_cents)+Math.round(extra*rate),revenue=Number(s.revenue_cents);
  if(!Number.isSafeInteger(cost)||!Number.isSafeInteger(revenue))throw Error('Scenario exceeds exact integer money range');
  return [{scope:s.code,currency:s.currency,extra_hours:extra,extra_cost_cents:Math.round(extra*rate),revised_cost_cents:cost,revenue_cents:revenue,margin_percent:revenue?Math.round((revenue-cost)/revenue*10000)/100:null}];
 }
 if(command==='export'){
  const dir=path.resolve(req(o,'dir'));if(fs.existsSync(dir)&&fs.readdirSync(dir).length)throw Error('Export directory must be empty');
  const data={format:'service-scoping-snapshot-v1',created_at:new Date().toISOString(),records:{}};
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');try{for(const t of ['clients','services','scopes','scope_items','assumptions','submissions','approvals','activity'])data.records[t]=await db.query(`select * from ${t} order by id`);}finally{await db.exec('ROLLBACK');}
  const file=path.join(dir,'snapshot.json');privateWrite(file,JSON.stringify(data,null,2)+'\n');return [{file,entities:Object.keys(data.records).length}];
 }
 if(['draft-sow','weekly-review'].includes(command)){
  let text;
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try{
   if(command==='draft-sow'){
    const d=await detail(db,args[0]),s=d.scope[0];text=`# DRAFT: ${s.name}\n\nClient: ${s.client}\nScope: ${s.code}, revision ${s.revision}, ${s.status}\nCurrency: ${s.currency}. ${s.tax_note}\nEstimate, subject to agreed scope. No acceptance or dispatch is recorded.\n\n`;
    text+=d.lines.map(l=>`## ${l.name}\n${l.description}\nEffort: ${l.total_hours} hours\nAcceptance: ${l.acceptance||'MISSING'}\nEstimated fee: ${l.total_sell_cents===null?'UNPRICED':(Number(l.total_sell_cents)/100).toFixed(2)} ${s.currency}\n`).join('\n');
    text+=`\n## Total estimate\n${s.revenue_cents===null?'UNPRICED':(Number(s.revenue_cents)/100).toFixed(2)} ${s.currency}\n\n## Exclusions\n${s.exclusions}\n\n## Assumptions\n`+d.assumptions.map(a=>`${a.name}: ${a.resolved_on?'resolved: '+a.evidence:'OPEN, owner '+a.owner}`).join('\n');
   }else{text='# DRAFT: weekly scoping review\n\n';for(const c of ['attention','margin-watch','approvals-due'])text+=`## ${c}\n\n${format(await db.query(reads[c]))}\n\n`;}
  }finally{await db.exec('ROLLBACK');}
  const file=path.resolve(o.out||path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts'),`${command}-${randomUUID()}.md`);privateWrite(file,text);return [{file,status:'draft only'}];
 }
 if(!commands.includes(command))throw Error(`Unknown command: ${command}`);
 return tx(db,req(o,'actor'),async()=>{
  if(command==='add-client')return db.query('insert into clients(code,name,contact,purpose,review_due) values($1,$2,$3,$4,$5) returning code,name',[req(o,'code'),req(o,'name'),o.contact||'',req(o,'purpose'),date(req(o,'review-due'))]);
  if(command==='review-client'){const c=await resolve(db,'clients',args[0]);return db.query('update clients set purpose=$1,review_due=$2 where id=$3 returning code,purpose,review_due',[req(o,'purpose'),date(req(o,'review-due')),c.id]);}
  if(command==='add-service')return db.query('insert into services(code,name,lob,category,phase,resource,hours,currency,description) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning code,state',[req(o,'code'),req(o,'name'),o.lob||'',o.category||'',req(o,'phase'),req(o,'resource'),num(req(o,'hours'),'hours'),currency(req(o,'currency')),req(o,'description')]);
  if(command==='set-rate'){
   const s=await resolve(db,'services',args[0]);const checked=date(req(o,'date'));if(checked>today())throw Error('Rate review cannot be in the future');
   return db.query("update services set cost_cents=$1,sell_cents=$2,reviewed_on=$3,state='active' where id=$4 returning code,state,cost_cents,sell_cents",[cents(req(o,'cost-cents'),'cost-cents'),cents(req(o,'sell-cents'),'sell-cents'),checked,s.id]);
  }
  if(command==='create-scope'){const c=await resolve(db,'clients',req(o,'client'));return db.query('insert into scopes(code,name,client_id,owner,currency,due,tax_note,exclusions) values($1,$2,$3,$4,$5,$6,$7,$8) returning code,revision',[req(o,'code'),req(o,'name'),c.id,req(o,'owner'),currency(req(o,'currency')),date(req(o,'due')),req(o,'tax-note'),req(o,'exclusions')]);}
  if(command==='add-line'){
   const s=await editable(db,args[0]),v=await resolve(db,'services',req(o,'service'));
   const services=await db.query('select * from services where id=$1 or parent_id=$1 order by parent_id nulls first,code',[v.id]);const out=[];
   for(const service of services){if(service.state!=='active'||service.cost_cents===null||service.sell_cents===null)throw Error(`Review and price ${service.code} before using it`);if(service.currency!==s.currency)throw Error('Currency mismatch; no automatic conversion');
    const [line]=await db.query('insert into scope_items(code,scope_id,service_id,name,phase,resource,hours,quantity,cost_cents,sell_cents,description,acceptance,evidence,language) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning code,name',[newCode('L'),s.id,service.id,service.name,service.phase,service.resource,service.hours,num(o.quantity||'1','quantity'),service.cost_cents,service.sell_cents,service.description,req(o,'acceptance'),req(o,'evidence'),JSON.stringify(service.language)]);out.push(line);
   }await bump(db,s);return out;
  }
  if(command==='set-line'){
   const l=await resolve(db,'scope_items',args[0]),[line]=await db.query('select * from scope_items where id=$1',[l.id]);const s=await editable(db,line.scope_id);
   const fields={hours:v=>num(v,'hours'),quantity:v=>num(v,'quantity'),'cost-cents':v=>cents(v,'cost-cents'),'sell-cents':v=>cents(v,'sell-cents'),acceptance:v=>v,evidence:v=>v,description:v=>v};
   const updates=Object.keys(fields).filter(k=>k in o);if(!updates.length)throw Error('Provide a line field to change');
   const vals=updates.map(k=>fields[k](o[k]));vals.push(line.id);
   const out=await db.query(`update scope_items set ${updates.map((k,i)=>k.replaceAll('-','_')+'=$'+(i+1)).join(',')} where id=$${vals.length} returning code,name`,vals);await bump(db,s);return out;
  }
  if(command==='add-assumption'){const s=await editable(db,args[0]);const r=await db.query('insert into assumptions(code,scope_id,name,owner,due) values($1,$2,$3,$4,$5) returning code,name',[req(o,'code'),s.id,req(o,'name'),req(o,'owner'),date(req(o,'due'))]);await bump(db,s);return r;}
  if(command==='resolve-assumption'){const a=await resolve(db,'assumptions',args[0]),[row]=await db.query('select * from assumptions where id=$1',[a.id]);const s=await editable(db,row.scope_id);if(row.resolved_on)throw Error('Assumption already resolved');const r=await db.query('update assumptions set resolved_on=current_date,evidence=$1 where id=$2 returning code,resolved_on',[req(o,'evidence'),a.id]);await bump(db,s);return r;}
  if(command==='submit'){
   const s=await editable(db,args[0]),d=await detail(db,s.id),t=d.scope[0];
   if([t.cost_cents,t.revenue_cents].some(v=>v!==null&&!Number.isSafeInteger(Number(v))))throw Error('Estimate total exceeds exact integer money range');
   if(!t.line_count||t.unpriced||t.missing_basis||t.unresolved)throw Error('Submission blocked: complete prices, estimate evidence, acceptance criteria and assumptions first');
   await db.query('insert into submissions(scope_id,revision,snapshot,actor) values($1,$2,$3,$4)',[s.id,s.revision,JSON.stringify(d),o.actor]);
   return db.query("update scopes set status='pending' where id=$1 returning code,revision,status",[s.id]);
  }
  if(command==='approve'){
   const s=await scope(db,args[0]);if(s.status!=='pending')throw Error('Scope must be pending');if(s.owner.toLowerCase()===o.actor.toLowerCase())throw Error('Scope owner cannot approve their own estimate');
   const kind=req(o,'kind');if(!['technical','commercial'].includes(kind))throw Error('kind must be technical or commercial');
   const [sub]=await db.query('select * from submissions where scope_id=$1 and revision=$2',[s.id,s.revision]);if(!sub)throw Error('Missing submitted revision');
   const [t]=await db.query('select * from margin_board where id=$1',[s.id]);
   if(kind==='commercial'&&(t.margin_percent===null||Number(t.margin_percent)<Number(t.minimum_margin))&&!o.exception)throw Error('Below-policy margin needs --exception= with a commercial reason');
   const other=await db.query('select actor from approvals where submission_id=$1',[sub.id]);if(other.some(a=>a.actor.toLowerCase()===o.actor.toLowerCase()))throw Error('Technical and commercial reviewers must differ');
   await db.query('insert into approvals(submission_id,kind,actor,evidence,exception_reason) values($1,$2,$3,$4,$5)',[sub.id,kind,o.actor,req(o,'evidence'),o.exception||'']);
   const [{n}]=await db.query('select count(*)::integer as n from approvals where submission_id=$1',[sub.id]);if(n===2)await db.query("update scopes set status='approved' where id=$1",[s.id]);
   return [{code:s.code,revision:s.revision,signoffs:n,status:n===2?'approved':'pending'}];
  }
  if(command==='revise'){const s=await scope(db,args[0]);if(!['pending','approved'].includes(s.status))throw Error('Only pending or approved scopes can be revised');return db.query("update scopes set revision=revision+1,status='draft' where id=$1 returning code,revision,status",[s.id]);}
  if(command==='close'){const s=await scope(db,args[0]);if(s.status!=='approved')throw Error('Only approved scopes can close');await db.query('insert into activity(entity,entity_id,actor,action,after_record) values($1,$2,$3,$4,$5)',['scopes',s.id,o.actor,'close reason',JSON.stringify({note:req(o,'note')})]);return db.query("update scopes set status='closed' where id=$1 returning code,status",[s.id]);}
  if(command==='log'){const s=await resolve(db,'scopes',args[0]);await db.query('insert into activity(entity,entity_id,actor,action,after_record) values($1,$2,$3,$4,$5)',['scopes',s.id,o.actor,'note',JSON.stringify({note:req(o,'note')})]);return [{code:s.code,logged:true}];}
  if(command==='import'){if(args[0]!=='scopestack')throw Error('Use import scopestack');return importServices(db,o);}
 },o['dry-run']===true);
}
export function parseArgs(argv){const args=[],o={};for(const a of argv){if(a.startsWith('--')){const i=a.indexOf('=');const k=a.slice(2,i<0?undefined:i);if(k in o)throw Error(`Duplicate flag: ${k}`);o[k]=i<0?true:a.slice(i+1);}else args.push(a);}return {command:args.shift()||'help',args,o};}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{const {command,args,o}=parseArgs(process.argv.slice(2));db=await getDb();const r=await run(db,command,args,o);console.log(o.json?JSON.stringify(r,null,2):Array.isArray(r)?format(r):Object.entries(r).map(([k,v])=>k+'\n'+format(v)).join('\n\n'));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
