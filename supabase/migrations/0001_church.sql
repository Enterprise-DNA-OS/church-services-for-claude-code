create schema church;
revoke all on schema church from public;
create function church.touch() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table church.people(id uuid primary key default gen_random_uuid(), code text unique not null, name text not null check(length(trim(name))>0), email text, active boolean not null default true, screening_reference text, screening_review_on date, privacy_review_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table church.people enable row level security;
create trigger touch before update on church.people for each row execute function church.touch();
create table church.teams(id uuid primary key default gen_random_uuid(), code text unique not null, name text not null, requires_screening boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table church.teams enable row level security;
create trigger touch before update on church.teams for each row execute function church.touch();
create table church.memberships(id uuid primary key default gen_random_uuid(), code text unique not null, person_id uuid not null references church.people(id), team_id uuid not null references church.teams(id), unique(person_id,team_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table church.memberships enable row level security;
create trigger touch before update on church.memberships for each row execute function church.touch();
create table church.services(id uuid primary key default gen_random_uuid(), code text unique not null, name text not null, starts_at timestamptz not null, ends_at timestamptz not null, campus text not null, status text not null default 'planned' check(status in ('planned','complete','cancelled')), check(ends_at>starts_at), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table church.services enable row level security;
create trigger touch before update on church.services for each row execute function church.touch();
create table church.roles(id uuid primary key default gen_random_uuid(), code text unique not null, service_id uuid not null references church.services(id), team_id uuid not null references church.teams(id), name text not null, needed integer not null check(needed>0), unique(service_id,team_id,name), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table church.roles enable row level security;
create trigger touch before update on church.roles for each row execute function church.touch();
create table church.assignments(id uuid primary key default gen_random_uuid(), code text unique not null, role_id uuid not null references church.roles(id), person_id uuid not null references church.people(id), status text not null default 'pending' check(status in ('pending','accepted','declined')), unique(role_id,person_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table church.assignments enable row level security;
create trigger touch before update on church.assignments for each row execute function church.touch();
create table church.blockouts(id uuid primary key default gen_random_uuid(), code text unique not null, person_id uuid not null references church.people(id), starts_at timestamptz not null, ends_at timestamptz not null, reason text not null default '', check(ends_at>starts_at), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table church.blockouts enable row level security;
create trigger touch before update on church.blockouts for each row execute function church.touch();
create table church.songs(id uuid primary key default gen_random_uuid(), code text unique not null, name text not null, author text not null default '', licence_reference text, licence_review_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table church.songs enable row level security;
create trigger touch before update on church.songs for each row execute function church.touch();
create table church.items(id uuid primary key default gen_random_uuid(), code text unique not null, service_id uuid not null references church.services(id), song_id uuid references church.songs(id), name text not null, position integer not null check(position>0), minutes integer not null check(minutes>=0), musical_key text, unique(service_id,position), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table church.items enable row level security;
create trigger touch before update on church.items for each row execute function church.touch();
create table church.followups(id uuid primary key default gen_random_uuid(), code text unique not null, person_id uuid not null references church.people(id), name text not null, owner text not null, due_on date not null, status text not null default 'open' check(status in ('open','done')), purpose text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table church.followups enable row level security;
create trigger touch before update on church.followups for each row execute function church.touch();
create table church.notes(id uuid primary key default gen_random_uuid(), code text unique not null, person_id uuid not null references church.people(id), author text not null, body text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table church.notes enable row level security;
create trigger touch before update on church.notes for each row execute function church.touch();
create function church.note_immutable() returns trigger language plpgsql as $$ begin raise exception 'Notes are append-only; record a correction'; end $$;
create trigger immutable before update or delete on church.notes for each row execute function church.note_immutable();
create function church.check_assignment() returns trigger language plpgsql as $$
declare r record; p record;
begin
 if new.status='declined' then return new; end if;
 select ro.*,s.starts_at,s.ends_at,s.status as service_status,t.requires_screening into r from church.roles ro join church.services s on s.id=ro.service_id join church.teams t on t.id=ro.team_id where ro.id=new.role_id;
 select * into p from church.people where id=new.person_id for update;
 if not p.active then raise exception 'Inactive volunteer'; end if;
 if r.service_status<>'planned' then raise exception 'Service is not planned'; end if;
 if not exists(select 1 from church.memberships where person_id=new.person_id and team_id=r.team_id) then raise exception 'Volunteer is not a team member'; end if;
 if r.requires_screening and (nullif(trim(p.screening_reference),'') is null or p.screening_review_on is null or p.screening_review_on<r.starts_at::date) then raise exception 'Screening evidence missing or review due before service'; end if;
 if exists(select 1 from church.blockouts where person_id=new.person_id and starts_at<r.ends_at and ends_at>r.starts_at) then raise exception 'Volunteer blocked out'; end if;
 if exists(select 1 from church.assignments a join church.roles ro on ro.id=a.role_id join church.services s on s.id=ro.service_id where a.person_id=new.person_id and a.id<>new.id and a.status<>'declined' and s.status='planned' and s.starts_at<r.ends_at and s.ends_at>r.starts_at) then raise exception 'Volunteer already scheduled at overlapping time'; end if;
 return new;
end $$;
create trigger assignment_guard before insert or update on church.assignments for each row execute function church.check_assignment();
create view church.roster with (security_invoker=true) as
select a.id,a.code,s.code service,s.starts_at,s.ends_at,s.campus,t.name team,r.name role,p.code person_code,p.name volunteer,a.status,r.id role_id,p.id person_id,s.id service_id,t.requires_screening
from church.assignments a join church.roles r on r.id=a.role_id join church.services s on s.id=r.service_id join church.teams t on t.id=r.team_id join church.people p on p.id=a.person_id where s.status<>'cancelled';
create view church.coverage with (security_invoker=true) as
select r.id,r.code,s.code service,s.starts_at,s.campus,t.name team,r.name role,r.needed,count(a.id) filter(where a.status='accepted')::int accepted,count(a.id) filter(where a.status='pending')::int pending,greatest(0,r.needed-count(a.id) filter(where a.status='accepted'))::int gap
from church.roles r join church.services s on s.id=r.service_id join church.teams t on t.id=r.team_id left join church.assignments a on a.role_id=r.id where s.status='planned' group by r.id,s.id,t.id;
create view church.service_order with (security_invoker=true) as
select i.id,i.code,s.id service_id,s.code service,s.starts_at,i.position,i.name,i.minutes,i.musical_key,so.code song,so.licence_reference,so.licence_review_on from church.items i join church.services s on s.id=i.service_id left join church.songs so on so.id=i.song_id where s.status<>'cancelled';
create view church.evidence_gaps with (security_invoker=true) as
select p.code record,'privacy-retention-review' rule,'Review why these personal records are still needed' action from church.people p where p.privacy_review_on is null or p.privacy_review_on<current_date
union all select p.code,'screening-policy','Verify team screening evidence before scheduling' from church.people p where exists(select 1 from church.memberships m join church.teams t on t.id=m.team_id where m.person_id=p.id and t.requires_screening) and (nullif(trim(p.screening_reference),'') is null or p.screening_review_on is null or p.screening_review_on<current_date)
union all select so.code,'music-permission-review','Verify permission before using this song' from church.songs so where so.licence_reference is null or so.licence_review_on is null or so.licence_review_on<current_date;
