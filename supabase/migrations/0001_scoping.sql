create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=clock_timestamp(); return new; end $$;
create table clients (
 id uuid primary key default gen_random_uuid(), code text unique not null, name text not null,
 contact text not null default '', purpose text not null default '', review_due date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table services (
 id uuid primary key default gen_random_uuid(), code text unique not null, name text not null,
 parent_id uuid references services(id), lob text not null default '', category text not null default '', phase text not null default '',
 resource text not null default '', hours numeric(10,2) not null default 0 check(hours>=0 and hours<=100000),
 cost_cents integer check(cost_cents>=0), sell_cents integer check(sell_cents>=0), currency text not null default 'NZD' check(currency in ('NZD','AUD','USD','EUR','GBP')),
 description text not null default '', language jsonb not null default '{}', source_key text unique,
 state text not null default 'pending' check(state in ('pending','active','archived')), reviewed_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(id<>parent_id)
);
create table scopes (
 id uuid primary key default gen_random_uuid(), code text unique not null, name text not null, client_id uuid not null references clients(id),
 owner text not null, currency text not null check(currency in ('NZD','AUD','USD','EUR','GBP')),
 due date not null, status text not null default 'draft' check(status in ('draft','pending','approved','closed')),
 revision integer not null default 1 check(revision>0), minimum_margin numeric(5,2) not null default 30 check(minimum_margin>=0 and minimum_margin<100),
 tax_note text not null, exclusions text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table scope_items (
 id uuid primary key default gen_random_uuid(), code text unique not null, scope_id uuid not null references scopes(id), service_id uuid references services(id),
 name text not null, phase text not null, resource text not null, hours numeric(10,2) not null check(hours>=0 and hours<=100000),
 quantity numeric(10,2) not null default 1 check(quantity>0 and quantity<=100000),
 cost_cents integer check(cost_cents>=0), sell_cents integer check(sell_cents>=0),
 description text not null, acceptance text not null default '', evidence text not null default '', language jsonb not null default '{}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table assumptions (
 id uuid primary key default gen_random_uuid(), code text unique not null, scope_id uuid not null references scopes(id), name text not null, owner text not null,
 due date not null, resolved_on date, evidence text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(resolved_on is null or length(trim(evidence))>0)
);
create table submissions (
 id uuid primary key default gen_random_uuid(), scope_id uuid not null references scopes(id), revision integer not null,
 snapshot jsonb not null, actor text not null, created_at timestamptz not null default now(), unique(scope_id,revision)
);
create table approvals (
 id uuid primary key default gen_random_uuid(), submission_id uuid not null references submissions(id),
 kind text not null check(kind in ('technical','commercial')), actor text not null, evidence text not null check(length(trim(evidence))>0),
 exception_reason text not null default '', created_at timestamptz not null default now(), unique(submission_id,kind)
);
create table activity (
 id uuid primary key default gen_random_uuid(), entity text not null, entity_id uuid not null, actor text not null,
 action text not null, before_record jsonb, after_record jsonb, created_at timestamptz not null default now()
);
create function record_change() returns trigger language plpgsql as $$
begin
 insert into activity(entity,entity_id,actor,action,before_record,after_record) values(TG_TABLE_NAME,new.id,coalesce(nullif(current_setting('app.actor',true),''),'direct database operator'),TG_OP,case when TG_OP='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));
 return new;
end $$;
create function immutable_record() returns trigger language plpgsql as $$ begin raise exception 'History is append-only'; end $$;
do $$ declare t text; begin
 foreach t in array array['clients','services','scopes','scope_items','assumptions'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated()',t);
 execute format('create trigger audit after insert or update on %I for each row execute function record_change()',t);
 end loop;
 foreach t in array array['submissions','approvals','activity'] loop
 execute format('create trigger immutable before update or delete on %I for each row execute function immutable_record()',t);
 end loop;
 foreach t in array array['clients','services','scopes','scope_items','assumptions','submissions','approvals','activity'] loop
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop;
end $$;
create view line_costs as
select i.*,round(i.hours*i.quantity,2) as total_hours,
 round(i.hours*i.quantity*i.cost_cents)::bigint as total_cost_cents,
 round(i.hours*i.quantity*i.sell_cents)::bigint as total_sell_cents,
 (i.hours<>s.hours or i.cost_cents is distinct from s.cost_cents or i.sell_cents is distinct from s.sell_cents or i.description<>s.description or i.language<>s.language) as differs_from_catalogue
from scope_items i left join services s on s.id=i.service_id;
create view scope_totals as
select s.*,c.name as client,
 count(i.id)::integer as line_count,
 coalesce(sum(i.total_hours),0) as hours,
 case when count(i.id)=0 or count(*) filter(where i.id is not null and i.cost_cents is null)>0 then null else sum(i.total_cost_cents)::bigint end as cost_cents,
 case when count(i.id)=0 or count(*) filter(where i.id is not null and i.sell_cents is null)>0 then null else sum(i.total_sell_cents)::bigint end as revenue_cents,
 count(*) filter(where i.id is not null and (i.cost_cents is null or i.sell_cents is null))::integer as unpriced,
 count(*) filter(where i.id is not null and (trim(i.acceptance)='' or trim(i.evidence)=''))::integer as missing_basis,
 (select count(*)::integer from assumptions a where a.scope_id=s.id and a.resolved_on is null) as unresolved,
 (select count(*)::integer from submissions sub join approvals ap on ap.submission_id=sub.id where sub.scope_id=s.id and sub.revision=s.revision) as signoffs
from scopes s join clients c on c.id=s.client_id left join line_costs i on i.scope_id=s.id group by s.id,c.name;
create view margin_board as
select t.*,case when revenue_cents>0 and cost_cents is not null then round((revenue_cents-cost_cents)*100.0/revenue_cents,2) end as margin_percent from scope_totals t;
create view attention as
select code as reference,name as item,owner,due,'Scope overdue'::text as issue from scopes where due<current_date and status not in ('closed','approved')
union all select code,name,owner,due,'Unresolved scope assumption' from assumptions where resolved_on is null
union all select code,name,owner,due,'Incomplete price or estimate basis' from scope_totals where status<>'closed' and (unpriced>0 or missing_basis>0 or line_count=0)
union all select code,name,owner,due,'Margin below policy' from margin_board where status<>'closed' and margin_percent<minimum_margin;
create view compliance_findings as
select code as reference,'NZ-PRICE'::text as rule,'Record the estimate basis, acceptance and complete rates'::text as finding from scope_totals where status<>'closed' and (missing_basis>0 or unpriced>0 or line_count=0)
union all select code,'NZ-IPP9','Review purpose and retention of contact details' from clients where contact<>'' and (trim(purpose)='' or review_due is null or review_due<current_date)
union all select code,'INTERNAL-SCOPE','Resolve scope assumptions before submission' from scope_totals where status<>'closed' and unresolved>0;
revoke all on line_costs,scope_totals,margin_board,attention,compliance_findings from public;
