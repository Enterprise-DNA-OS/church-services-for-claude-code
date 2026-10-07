import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';
export const TABLES=JSON.parse(fs.readFileSync(path.join(REPO_ROOT,'scripts/tables.json'),'utf8'));
export const READS={
 people:'select code,name,email,active,privacy_review_on from church.people order by name',
 teams:'select code,name,requires_screening from church.teams order by name',
 memberships:'select m.code,p.name volunteer,t.name team from church.memberships m join church.people p on p.id=m.person_id join church.teams t on t.id=m.team_id order by t.name,p.name',
 'service-plans':'select code,name,starts_at,ends_at,campus,status from church.services order by starts_at',
 'service-order':'select service,position,name,minutes,musical_key from church.service_order order by starts_at,position',
 roster:'select code,service,starts_at,team,role,volunteer,status from church.roster order by starts_at,team,volunteer',
 'roster-gaps':'select service,starts_at,team,role,needed,accepted,pending,gap from church.coverage where starts_at>=current_date and gap>0 order by starts_at,team',
 'pending-replies':"select code,service,starts_at,volunteer,team,role from church.roster where status='pending' and starts_at>=current_date order by starts_at",
 'call-cycle':"select p.code,p.name,p.email,f.name task,f.owner,f.due_on from church.followups f join church.people p on p.id=f.person_id where f.status='open' order by f.due_on",
 'followups-due':"select f.code,p.name,f.name task,f.owner,f.due_on from church.followups f join church.people p on p.id=f.person_id where f.status='open' and f.due_on<=current_date order by f.due_on",
 blockouts:'select b.code,p.name,b.starts_at,b.ends_at,b.reason from church.blockouts b join church.people p on p.id=b.person_id order by b.starts_at',
 songs:'select code,name,author,licence_reference,licence_review_on from church.songs order by name',
 'song-history':"select so.code,so.name,count(i.id) filter(where s.starts_at<now() and s.status='complete')::int past_uses,max(s.starts_at) filter(where s.starts_at<now() and s.status='complete') last_used,count(i.id) filter(where s.starts_at>=now() and s.status='planned')::int planned_uses from church.songs so left join church.items i on i.song_id=so.id left join church.services s on s.id=i.service_id group by so.id order by so.name",
 'volunteer-load':"select p.code,p.name,count(r.id)::int assignments,count(r.id) filter(where r.status='pending')::int pending,count(distinct r.starts_at::date)::int days from church.people p left join church.roster r on r.person_id=p.id and r.status<>'declined' and r.starts_at>=current_date and r.starts_at<current_date+interval '28 days' group by p.id order by assignments desc,p.name",
 'plan-length':"select s.code,s.name,extract(epoch from (s.ends_at-s.starts_at))::float8/60 planned_minutes,coalesce(sum(i.minutes),0)::int item_minutes,(extract(epoch from (s.ends_at-s.starts_at))::float8/60-coalesce(sum(i.minutes),0)) spare_minutes from church.services s left join church.items i on i.service_id=s.id where s.status='planned' group by s.id order by s.starts_at",
 'screening-due':"select p.code,p.name,p.screening_review_on from church.people p where exists(select 1 from church.memberships m join church.teams t on t.id=m.team_id where m.person_id=p.id and t.requires_screening) and (p.screening_review_on is null or p.screening_review_on<current_date+interval '30 days' or nullif(trim(p.screening_reference),'') is null) order by p.name",
 compliance:'select * from church.evidence_gaps order by rule,record',
 'schedule-conflicts':"select r.code,r.service,r.volunteer,'blockout' issue from church.roster r where r.status<>'declined' and r.starts_at>=current_date and exists(select 1 from church.blockouts b where b.person_id=r.person_id and b.starts_at<r.ends_at and b.ends_at>r.starts_at) union all select r.code,r.service,r.volunteer,'screening review' from church.roster r join church.people p on p.id=r.person_id where r.status<>'declined' and r.starts_at>=current_date and r.requires_screening and (p.screening_review_on is null or p.screening_review_on<r.starts_at::date or nullif(trim(p.screening_reference),'') is null) union all select r.code,r.service,r.volunteer,'overlap' from church.roster r where r.status<>'declined' and r.starts_at>=current_date and exists(select 1 from church.roster x where x.person_id=r.person_id and x.id<>r.id and x.status<>'declined' and x.starts_at<r.ends_at and x.ends_at>r.starts_at) union all select r.code,r.service,r.volunteer,'inactive or no membership' from church.roster r join church.people p on p.id=r.person_id join church.roles ro on ro.id=r.role_id where r.status<>'declined' and r.starts_at>=current_date and (not p.active or not exists(select 1 from church.memberships m where m.person_id=p.id and m.team_id=ro.team_id))",
 'unfilled-screened-roles':"select c.service,c.team,c.role,c.gap from church.coverage c join church.roles r on r.id=c.id join church.teams t on t.id=r.team_id where t.requires_screening and c.starts_at>=current_date and c.gap>0 order by c.starts_at",
 'busy-with-followups':"select p.code,p.name,count(distinct r.id)::int assignments,count(distinct f.id)::int overdue_followups from church.people p join church.roster r on r.person_id=p.id and r.status<>'declined' and r.starts_at>=current_date and r.starts_at<current_date+interval '28 days' join church.followups f on f.person_id=p.id and f.status='open' and f.due_on<=current_date group by p.id order by assignments desc",
 'music-review':"select service,name,licence_review_on from church.service_order where song is not null and starts_at>=current_date and (licence_reference is null or licence_review_on is null or licence_review_on<starts_at::date) order by starts_at,position",
 'campus-coverage':"select campus,sum(needed)::int needed,sum(accepted)::int accepted,sum(gap)::int gap from church.coverage where starts_at>=current_date and starts_at<current_date+interval '28 days' group by campus order by campus"
};
const refs={person_id:'people',team_id:'teams',service_id:'services',role_id:'roles',song_id:'songs'};
export async function resolve(db,t,ref){
 if(!TABLES[t]||!ref)throw Error('A valid record type and reference are required');
 const exact=await db.query(`select * from church.${t} where lower(code)=lower($1) or id::text=$1`,[ref]);
 if(exact.length===1)return exact[0];
 const rows=await db.query(`select * from church.${t} where lower(code)=lower($1) or id::text like $2${TABLES[t].includes('name')?' or lower(name) like lower($2)':''} order by code`,[ref,ref+'%']);
 if(rows.length!==1)throw Error(rows.length?`Ambiguous ${t}: ${rows.map(r=>r.code+': '+(r.name||r.id)).join(', ')}`:`No ${t} match ${ref}`);return rows[0];
}
function argsOf(args){const pos=[],opts={};for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');const k=i<0?a.slice(2):a.slice(2,i);if(k in opts)throw Error('Duplicate option '+k);opts[k]=i<0?true:a.slice(i+1);}else pos.push(a);}return {pos,opts};}
function need(opts,k){if(typeof opts[k]!=='string'||!opts[k].trim())throw Error('Required --'+k+'=<value>');return opts[k];}
async function atomic(db,fn,dry=false){await db.exec('BEGIN');try{const v=await fn();await db.exec(dry?'ROLLBACK':'COMMIT');return v;}catch(e){await db.exec('ROLLBACK');throw e;}}
export async function importPeople(db,file,dry=false){
 const rows=parseCsv(fs.readFileSync(file,'utf8'));if(!rows.length)throw Error('No people in CSV');const seen=new Set();
 return atomic(db,async()=>{let inserted=0,updated=0;for(const row of rows){const id=pick(row,'Person ID','ID','remote_id').trim(),first=pick(row,'First Name').trim(),last=pick(row,'Last Name').trim();if(!/^\d+$/.test(id)||!first||!last)throw Error('CSV requires numeric Person ID, First Name and Last Name');if(seen.has(id))throw Error('Duplicate Person ID '+id);seen.add(id);const code='PC-'+id;const exists=await db.query('select id from church.people where code=$1',[code]);await db.query('insert into church.people(code,name,email) values($1,$2,$3) on conflict(code) do update set name=excluded.name,email=coalesce(excluded.email,church.people.email)',[code,first+' '+last,pick(row,'Email','Email Address','Primary Email')||null]);exists.length?updated++:inserted++;}return {inserted,updated,dry_run:dry,scope:'people only'};},dry);
}
export async function run(db,args){
 const {pos,opts}=argsOf(args);const [cmd='help',...rest]=pos;
 const spec={add:['data'],log:['author','text'],reply:['status'],screening:['reference','until'], 'privacy-review':['until'],import:['file','dry-run'],export:['out']};
 for(const k of Object.keys(opts))if(k!=='json'&&!(spec[cmd]||[]).includes(k))throw Error('Unknown option --'+k);
 for(const k of ['json','dry-run'])if(k in opts&&opts[k]!==true)throw Error('--'+k+' is a boolean flag');
 const counts={add:1,log:1,reply:1,screening:1,'privacy-review':1,import:1,person:1,service:1,'complete-followup':1};
 if(rest.length!==(counts[cmd]||0))throw Error('Unexpected or missing arguments for '+cmd);
 if(cmd==='help')return {reads:Object.keys(READS),writes:Object.keys(spec),other:['person','service','complete-followup','attention','weekly-review','draft-roster']};
 if(READS[cmd])return db.query(READS[cmd]);
 if(cmd==='attention'||cmd==='weekly-review'){const out={};for(const c of ['roster-gaps','pending-replies','followups-due','schedule-conflicts','compliance'])out[c]=await run(db,[c]);return out;}
 if(cmd==='person'){const p=await resolve(db,'people',rest[0]);return {person:p,roster:await db.query('select * from church.roster where person_id=$1 order by starts_at',[p.id]),notes:await db.query('select author,body,created_at from church.notes where person_id=$1 order by created_at',[p.id])};}
 if(cmd==='service'){const s=await resolve(db,'services',rest[0]);return {service:s,order:await db.query('select * from church.service_order where service_id=$1 order by position',[s.id]),roster:await db.query('select * from church.roster where service_id=$1 order by team,role',[s.id])};}
 if(cmd==='add'){const t=rest[0];if(!TABLES[t]||t==='notes')throw Error('Unsupported type; use log for notes');const data=JSON.parse(fs.readFileSync(need(opts,'data'),'utf8'));if(!data||Array.isArray(data)||typeof data!=='object'||!Object.keys(data).length)throw Error('Expected record object');for(const k of Object.keys(data)){if(!TABLES[t].includes(k))throw Error('Unsupported field '+k);if(refs[k]&&data[k]!==null)data[k]=(await resolve(db,refs[k],data[k])).id;}
 const ks=Object.keys(data);return (await db.query(`insert into church.${t}(${ks.join(',')}) values(${ks.map((k,i)=>'$'+(i+1)).join(',')}) returning *`,ks.map(k=>data[k])))[0];}
 if(cmd==='log'){const p=await resolve(db,'people',rest[0]);return (await db.query('insert into church.notes(code,person_id,author,body) values($1,$2,$3,$4) returning *',['NOTE-'+randomUUID(),p.id,need(opts,'author'),need(opts,'text')]))[0];}
 if(cmd==='reply'){const a=await resolve(db,'assignments',rest[0]);return (await db.query('update church.assignments set status=$1 where id=$2 returning code,status',[need(opts,'status'),a.id]))[0];}
 if(cmd==='complete-followup'){const f=await resolve(db,'followups',rest[0]);return (await db.query("update church.followups set status='done' where id=$1 returning code,status",[f.id]))[0];}
 if(cmd==='screening'||cmd==='privacy-review'){const p=await resolve(db,'people',rest[0]);const until=need(opts,'until');if(!/^\d{4}-\d{2}-\d{2}$/.test(until)||Number.isNaN(Date.parse(until))||new Date(until).toISOString().slice(0,10)!==until)throw Error('Use a valid YYYY-MM-DD date');return (await db.query(cmd==='screening'?'update church.people set screening_reference=$1,screening_review_on=$2 where id=$3 returning code,screening_review_on':'update church.people set privacy_review_on=$1 where id=$2 returning code,privacy_review_on',cmd==='screening'?[need(opts,'reference'),until,p.id]:[until,p.id]))[0];}
 if(cmd==='import'){if(rest[0]!=='planning-center')throw Error('Only planning-center is supported');return importPeople(db,need(opts,'file'),!!opts['dry-run']);}
 if(cmd==='export'){const out=await atomic(db,async()=>{await db.exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');const data={};for(const t of Object.keys(TABLES))data[t]=await db.query(`select * from church.${t} order by code`);return data;});if(opts.out){fs.writeFileSync(need(opts,'out'),JSON.stringify(out,null,2),{flag:'wx',mode:0o600});return {file:opts.out};}return out;}
 if(cmd==='draft-roster'){const data=await run(db,['weekly-review']);const dir=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'roster-'+randomUUID()+'.md');fs.writeFileSync(file,'# Draft coordinator review\n\nInternal draft. Review before sharing.\n\n'+JSON.stringify(data,null,2),{flag:'wx',mode:0o600});return {file,sent:false};}
 throw Error('Unknown command '+cmd);
}
export function human(result){if(Array.isArray(result))return table(result,Object.keys(result[0]||{}).map(key=>({key,label:key,format:v=>v instanceof Date?v.toISOString():typeof v==='object'&&v!==null?JSON.stringify(v):v})));return JSON.stringify(result,null,2);}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):human(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{await db?.close();}}
