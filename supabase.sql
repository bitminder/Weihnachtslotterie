create extension if not exists pgcrypto;

create table if not exists public.lottery_assignments (
  giver text primary key,
  recipient text not null unique,
  has_drawn boolean not null default false,
  drawn_at timestamptz
);

alter table public.lottery_assignments enable row level security;
revoke all on table public.lottery_assignments from anon, authenticated;

drop function if exists public.lottery_status();
create function public.lottery_status()
returns table(name text, has_drawn boolean)
language sql
security definer
set search_path = public
as $$
  select n.name, coalesce(a.has_drawn,false)
  from unnest(array['Alexander','Nicolina','Anna','Jan','Iwona','Dariusz','Magda','Livan']::text[]) with ordinality as n(name, ord)
  left join public.lottery_assignments a on a.giver=n.name
  order by n.ord;
$$;

drop function if exists public.draw_lottery(text);
create function public.draw_lottery(p_giver text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  people text[] := array['Alexander','Nicolina','Anna','Jan','Iwona','Dariusz','Magda','Livan'];
  shuffled text[];
  i int;
  tries int := 0;
  result text;
begin
  if not (p_giver = any(people)) then raise exception 'Unbekannter Teilnehmer'; end if;
  perform pg_advisory_xact_lock(20261224);

  if not exists(select 1 from public.lottery_assignments) then
    loop
      tries := tries + 1;
      select array_agg(x order by random()) into shuffled from unnest(people) x;
      exit when not exists (
        select 1 from generate_subscripts(people,1) s where people[s]=shuffled[s]
      );
      if tries > 1000 then raise exception 'Keine gültige Ziehung erzeugt'; end if;
    end loop;
    for i in 1..array_length(people,1) loop
      insert into public.lottery_assignments(giver,recipient,has_drawn) values(people[i],shuffled[i],false);
    end loop;
  end if;

  select recipient into result from public.lottery_assignments where giver=p_giver for update;
  if exists(select 1 from public.lottery_assignments where giver=p_giver and has_drawn) then
    raise exception 'Für diese Person wurde bereits gezogen';
  end if;
  update public.lottery_assignments set has_drawn=true, drawn_at=now() where giver=p_giver;
  return result;
end;
$$;

grant execute on function public.lottery_status() to anon, authenticated;
grant execute on function public.draw_lottery(text) to anon, authenticated;