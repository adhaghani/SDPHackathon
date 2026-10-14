-- Shared names must not expose consent timestamps or comfort preferences.
drop policy profiles_select_own_or_comember on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

create view public.public_profiles as
select p.id, p.display_name
from public.profiles p
where p.id = auth.uid() or exists (
  select 1 from public.township_members mine
  join public.township_members theirs on theirs.township_id = mine.township_id
  where mine.user_id = auth.uid() and mine.status = 'active'
    and theirs.user_id = p.id and theirs.status = 'active'
);
revoke all on public.public_profiles from public, anon;
grant select on public.public_profiles to authenticated;
