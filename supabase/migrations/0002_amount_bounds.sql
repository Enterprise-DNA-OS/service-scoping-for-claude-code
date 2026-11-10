-- Keep every exported integer amount inside JavaScript's exact integer range.
alter table scope_items add constraint exact_line_amounts check (
 hours*quantity*greatest(coalesce(cost_cents,0),coalesce(sell_cents,0))<=9007199254740991
);
-- Scope totals have a separate check before submission and scenario calculations.
