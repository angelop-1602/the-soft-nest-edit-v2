-- The Soft Nest Edit: account terms/privacy acknowledgement + voluntary newsletter preferences.
-- Run in your OWN Supabase project SQL Editor before enabling the client-side checkboxes.
-- This does NOT send newsletters or create a third-party mailing list.
-- Existing saved_products rows are unaffected.

create table if not exists public.member_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  terms_version text,
  terms_accepted_at timestamptz,
  privacy_version text,
  privacy_acknowledged_at timestamptz,
  newsletter_opt_in boolean not null default false,
  newsletter_opt_in_at timestamptz,
  newsletter_opt_out_at timestamptz,
  updated_at timestamptz not null default now()
);

-- The database, not the visitor's browser clock, assigns recorded timestamps.
create or replace function public.softnest_stamp_member_preferences()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.terms_version is not null then new.terms_accepted_at := now(); end if;
    if new.privacy_version is not null then new.privacy_acknowledged_at := now(); end if;
    if new.newsletter_opt_in then new.newsletter_opt_in_at := now(); end if;
  else
    if new.terms_version is distinct from old.terms_version and new.terms_version is not null then
      new.terms_accepted_at := now();
    else
      new.terms_accepted_at := old.terms_accepted_at;
    end if;
    if new.privacy_version is distinct from old.privacy_version and new.privacy_version is not null then
      new.privacy_acknowledged_at := now();
    else
      new.privacy_acknowledged_at := old.privacy_acknowledged_at;
    end if;
    if new.newsletter_opt_in is distinct from old.newsletter_opt_in then
      if new.newsletter_opt_in then
        new.newsletter_opt_in_at := now();
      else
        new.newsletter_opt_out_at := now();
      end if;
    else
      new.newsletter_opt_in_at := old.newsletter_opt_in_at;
      new.newsletter_opt_out_at := old.newsletter_opt_out_at;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists softnest_member_preferences_stamp on public.member_preferences;
create trigger softnest_member_preferences_stamp
  before insert or update on public.member_preferences
  for each row execute function public.softnest_stamp_member_preferences();

alter table public.member_preferences enable row level security;
revoke all on public.member_preferences from anon;
grant select, insert, update on public.member_preferences to authenticated;
revoke delete on public.member_preferences from authenticated;

-- Users can see and change only their own record and cannot claim someone else's email.
drop policy if exists softnest_preferences_select_self on public.member_preferences;
create policy softnest_preferences_select_self on public.member_preferences
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists softnest_preferences_insert_self on public.member_preferences;
create policy softnest_preferences_insert_self on public.member_preferences
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and lower(email) = lower((select auth.jwt() ->> 'email'))
  );

drop policy if exists softnest_preferences_update_self on public.member_preferences;
create policy softnest_preferences_update_self on public.member_preferences
  for update to authenticated using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and lower(email) = lower((select auth.jwt() ->> 'email'))
  );

-- Future newsletter sending MUST read only newsletter_opt_in = true and support
-- one-click opt-out, physical mailing address and applicable double opt-in.
-- Browser-managed timestamps are not legal-grade immutable audit logs.
