do $$ begin
if exists(select 1 from clients where code='C-DEMO') then return; end if;
perform set_config('app.actor','Fictional demo seed',true);
insert into clients(code,name,contact,purpose,review_due) values
 ('C-DEMO','Harbour Example Co','operations@example.invalid','Current service proposal',current_date+180),
 ('C-OLD','Harbour Example Archive','archive@example.invalid','',current_date-90);
insert into services(code,name,lob,category,phase,resource,hours,cost_cents,sell_cents,description,state,reviewed_on) values
 ('S-DISC','Network discovery','Infrastructure','Network','Discover','Consultant',8,9500,18000,'Assess the existing environment and record constraints.','active',current_date-30),
 ('S-MIG','Cloud migration','Cloud','Migration','Implement','Engineer',4,11000,20000,'Prepare the cutover and coordinate the work.','active',current_date-200),
 ('S-TEST','Recovery rehearsal','Cloud','Continuity','Validate','Engineer',6,11000,20000,'Rehearse recovery against the agreed acceptance criteria.','active',current_date-20);
insert into services(code,name,parent_id,lob,category,phase,resource,hours,cost_cents,sell_cents,description,state,reviewed_on)
select 'S-CUT','Cutover execution',id,'Cloud','Migration','Implement','Engineer',16,11000,20000,'Execute the approved migration runbook.','active',current_date-200 from services where code='S-MIG';
insert into scopes(code,name,client_id,owner,currency,due,tax_note,exclusions) select 'Q-101','Harbour migration',id,'Morgan','NZD',current_date-2,'Estimate excludes GST.','Hardware and third-party licences excluded.' from clients where code='C-DEMO';
insert into scopes(code,name,client_id,owner,currency,due,tax_note,exclusions) select 'Q-102','Harbour recovery review',id,'Taylor','NZD',current_date+7,'Estimate excludes GST.','No production failover is authorised.' from clients where code='C-DEMO';
insert into scope_items(code,scope_id,service_id,name,phase,resource,hours,quantity,cost_cents,sell_cents,description,acceptance,evidence)
select 'L-101',q.id,s.id,s.name,s.phase,s.resource,12,1,s.cost_cents,12000,s.description,'Discovery report accepted by service owner.','Fictional workshop estimate' from scopes q,services s where q.code='Q-101' and s.code='S-DISC';
insert into scope_items(code,scope_id,service_id,name,phase,resource,hours,quantity,cost_cents,sell_cents,description,acceptance,evidence)
select 'L-102',q.id,s.id,s.name,s.phase,s.resource,s.hours,1,null,null,s.description,'','' from scopes q,services s where q.code='Q-101' and s.code='S-MIG';
insert into scope_items(code,scope_id,service_id,name,phase,resource,hours,quantity,cost_cents,sell_cents,description,acceptance,evidence)
select 'L-103',q.id,s.id,s.name,s.phase,s.resource,s.hours,1,s.cost_cents,s.sell_cents,s.description,'Recovery test report signed by the customer owner.','Fictional recovery rehearsal plan' from scopes q,services s where q.code='Q-102' and s.code='S-TEST';
insert into assumptions(code,scope_id,name,owner,due) select 'A-101',id,'Confirm usable backup before cutover','Morgan',current_date-3 from scopes where code='Q-101';
end $$;
