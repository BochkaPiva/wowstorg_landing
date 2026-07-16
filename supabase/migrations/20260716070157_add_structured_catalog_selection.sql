alter table public.landing_leads
  add column if not exists catalog_selection jsonb not null default '[]'::jsonb;

alter table public.landing_leads
  drop constraint if exists landing_leads_catalog_selection_check;

alter table public.landing_leads
  add constraint landing_leads_catalog_selection_check
  check (
    jsonb_typeof(catalog_selection) = 'array'
    and jsonb_array_length(catalog_selection) <= 100
  );

update public.landing_leads as lead
set catalog_selection = coalesce((
  select jsonb_agg(
    jsonb_build_object(
      'id', grouped.item_id,
      'title', coalesce(item.title, grouped.item_id),
      'section', coalesce(category.title, 'Каталог'),
      'quantity', grouped.quantity
    )
    order by coalesce(category.sort_order, 999), coalesce(item.sort_order, 999), grouped.item_id
  )
  from (
    select selected_id as item_id, count(*)::integer as quantity
    from unnest(lead.catalog_selection_ids) as selected_id
    group by selected_id
  ) as grouped
  left join public.catalog_items as item on item.id::text = grouped.item_id
  left join public.catalog_categories as category on category.id = item.category_id
), '[]'::jsonb)
where jsonb_array_length(lead.catalog_selection) = 0
  and cardinality(lead.catalog_selection_ids) > 0;

drop function if exists public.accept_landing_lead(
  text, text, text, text, text, text, date, boolean, text, text[], text, text
);

create function public.accept_landing_lead(
  p_name text,
  p_company text,
  p_contact_type text,
  p_contact text,
  p_event_type text,
  p_guest_range text,
  p_event_date date,
  p_date_is_flexible boolean,
  p_message text,
  p_catalog_selection_ids text[],
  p_consent_version text,
  p_ip_hash text,
  p_catalog_selection jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_window timestamptz;
  submission_count integer;
  new_lead_id uuid;
  normalized_selection jsonb;
  normalized_selection_ids text[] := '{}'::text[];
  selection_item jsonb;
  selection_id text;
  selection_title text;
  selection_section text;
  selection_quantity integer;
  total_quantity integer := 0;
begin
  if p_ip_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid request fingerprint' using errcode = '22023';
  end if;

  if length(trim(p_name)) not between 1 and 160
    or length(trim(p_contact)) not between 3 and 320
    or length(trim(p_contact_type)) not between 2 and 40
    or length(trim(p_event_type)) not between 2 and 120
    or length(trim(p_guest_range)) not between 1 and 80
    or length(trim(p_consent_version)) not between 1 and 40
  then
    raise exception 'invalid lead payload' using errcode = '22023';
  end if;

  if p_catalog_selection is null then
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'id', grouped.item_id,
        'title', coalesce(item.title, grouped.item_id),
        'section', coalesce(category.title, 'Каталог'),
        'quantity', grouped.quantity
      )
      order by coalesce(category.sort_order, 999), coalesce(item.sort_order, 999), grouped.item_id
    ), '[]'::jsonb)
    into normalized_selection
    from (
      select selected_id as item_id, count(*)::integer as quantity
      from unnest(coalesce(p_catalog_selection_ids, '{}'::text[])) as selected_id
      group by selected_id
    ) as grouped
    left join public.catalog_items as item on item.id::text = grouped.item_id
    left join public.catalog_categories as category on category.id = item.category_id;
  else
    normalized_selection := p_catalog_selection;
  end if;

  if jsonb_typeof(normalized_selection) <> 'array'
    or jsonb_array_length(normalized_selection) > 100
  then
    raise exception 'invalid catalog selection' using errcode = '22023';
  end if;

  for selection_item in select value from jsonb_array_elements(normalized_selection)
  loop
    if jsonb_typeof(selection_item) <> 'object'
      or coalesce(jsonb_typeof(selection_item -> 'id'), 'null') <> 'string'
      or coalesce(jsonb_typeof(selection_item -> 'title'), 'null') <> 'string'
      or coalesce(jsonb_typeof(selection_item -> 'section'), 'null') <> 'string'
      or coalesce(jsonb_typeof(selection_item -> 'quantity'), 'null') <> 'number'
      or (selection_item ->> 'quantity') !~ '^[0-9]+$'
    then
      raise exception 'invalid catalog selection item' using errcode = '22023';
    end if;

    selection_id := trim(selection_item ->> 'id');
    selection_title := trim(selection_item ->> 'title');
    selection_section := trim(selection_item ->> 'section');
    selection_quantity := (selection_item ->> 'quantity')::integer;

    if length(selection_id) not between 1 and 160
      or length(selection_title) not between 1 and 200
      or length(selection_section) not between 1 and 120
      or selection_quantity not between 1 and 200
    then
      raise exception 'invalid catalog selection item' using errcode = '22023';
    end if;

    total_quantity := total_quantity + selection_quantity;
    if total_quantity > 200 then
      raise exception 'catalog selection is too large' using errcode = '22023';
    end if;

    normalized_selection_ids := normalized_selection_ids
      || array_fill(selection_id, array[selection_quantity]);
  end loop;

  current_window := to_timestamp(floor(extract(epoch from now()) / 600) * 600);

  insert into public.lead_submission_limits (ip_hash, window_start, request_count, updated_at)
  values (p_ip_hash, current_window, 1, now())
  on conflict (ip_hash, window_start) do update
  set request_count = public.lead_submission_limits.request_count + 1,
      updated_at = now()
  returning request_count into submission_count;

  if submission_count > 5 then
    raise exception 'lead rate limit exceeded' using errcode = 'P0001';
  end if;

  insert into public.landing_leads (
    name,
    company,
    contact_type,
    contact,
    event_type,
    guest_range,
    event_date,
    date_is_flexible,
    message,
    catalog_selection_ids,
    catalog_selection,
    consent_version,
    consented_at
  )
  values (
    trim(p_name),
    nullif(trim(coalesce(p_company, '')), ''),
    trim(p_contact_type),
    trim(p_contact),
    trim(p_event_type),
    trim(p_guest_range),
    case when p_date_is_flexible then null else p_event_date end,
    p_date_is_flexible,
    nullif(trim(coalesce(p_message, '')), ''),
    normalized_selection_ids,
    normalized_selection,
    trim(p_consent_version),
    now()
  )
  returning id into new_lead_id;

  insert into public.notification_outbox (lead_id)
  values (new_lead_id);

  return new_lead_id;
end;
$$;

revoke all on function public.accept_landing_lead(
  text, text, text, text, text, text, date, boolean, text, text[], text, text, jsonb
) from public, anon, authenticated;

grant execute on function public.accept_landing_lead(
  text, text, text, text, text, text, date, boolean, text, text[], text, text, jsonb
) to service_role;

comment on column public.landing_leads.catalog_selection is
  'Canonical catalog selection snapshot: item id, title, section and requested quantity.';

comment on function public.accept_landing_lead(
  text, text, text, text, text, text, date, boolean, text, text[], text, text, jsonb
) is 'Service-only atomic lead ingestion with rate limiting, canonical catalog quantities and notification outbox creation.';
