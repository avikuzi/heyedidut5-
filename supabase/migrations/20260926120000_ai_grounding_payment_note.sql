-- Committee AI grounding: include per-apartment payment method and balance note.
-- Apply in the Supabase SQL editor (or `supabase db push`) AFTER
-- 20260916120000_init_vaad.sql. The app does not apply this file itself.
--
-- Columns (from the init migration):
--   public.properties.payment_method text not null default ''
--   public.properties.balance_note text
-- JSON keys are camelCase (paymentMethod, balanceNote), omitted when blank.
-- Phone and email stay out. is_committee() / security definer are unchanged.

create or replace function public.build_ai_grounding(p_period_label text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_period text;
  v_building public.buildings%rowtype;
  v_balance numeric;
  v_prev numeric;
  v_result jsonb;
begin
  if not public.is_committee() then
    raise exception 'committee only';
  end if;

  v_period := coalesce(nullif(p_period_label, ''), to_char(timezone('Asia/Jerusalem', now()), 'YYYY-MM'));

  select * into v_building from public.buildings order by created_at asc limit 1;

  select t.balance into v_balance
  from public.transactions t
  where t.building_id = v_building.id
  order by t.date desc, t.id desc
  limit 1;

  select t.balance into v_prev
  from public.transactions t
  where t.building_id = v_building.id
    and to_char(t.date, 'YYYY-MM') < v_period
  order by t.date desc, t.id desc
  limit 1;

  select jsonb_build_object(
    'asOf', to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'building', jsonb_build_object(
      'id', v_building.id::text,
      'name', v_building.name
    ),
    'fund', jsonb_build_object(
      'balance', coalesce(v_balance, 0),
      'currency', 'ILS',
      'previousBalance', v_prev,
      'periodLabel', v_period
    ),
    'tenants', coalesce((
      select jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'apartment', p.property_number::text,
          'displayName', p.residents,
          'balance', p.current_balance,
          'lastPaymentAt', (
            select to_char(max(t.date), 'YYYY-MM-DD')
            from public.transactions t
            where t.building_id = p.building_id
              and t.type = 'income'
              and t.apartment_number = p.property_number
          ),
          'paymentMethod', nullif(btrim(p.payment_method), ''),
          'balanceNote', nullif(btrim(p.balance_note), '')
        ))
        order by p.property_number
      )
      from public.properties p
      where p.building_id = v_building.id
    ), '[]'::jsonb),
    'ledger', coalesce((
      select jsonb_agg(tx order by tx->>'date' desc)
      from (
        select jsonb_build_object(
          'id', t.id::text,
          'date', to_char(t.date, 'YYYY-MM-DD'),
          'type', t.type,
          'amount', t.amount,
          'category', t.category,
          'note', t.description,
          'apartment', t.apartment_number::text
        ) as tx
        from public.transactions t
        where t.building_id = v_building.id
        order by t.date desc, t.id desc
        limit 200
      ) ledger_rows
    ), '[]'::jsonb),
    'anomalyHints', jsonb_build_object(
      'expenseThresholdAbs', 2000,
      'expenseVsAvgMultiplier', 1.15
    )
  ) into v_result;

  return v_result;
end;
$$;
