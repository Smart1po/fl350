# The lock

What stops one member reading another member's flights, why it is built the way
it is, and the evidence that it holds.

---

## The picture

Night four was a filing cabinet: anyone with a key could open it and everything
sat in one drawer together.

This is a locker room. Same building, different rule. One room, many lockers, and
a key opens exactly one of them. The person next to you cannot open yours — not
because they are polite, because the lock does not turn for them.

The database is the room. The policy is the lock.

---

## Two locks, not one

They are independent, and either one alone would be enough. Both are on because
a mistake in one should not be the end of it.

### Lock one — the table grant

```sql
revoke all on table public.flights from anon;
grant select, insert, update, delete on table public.flights to authenticated;
```

`anon` is the role a signed-out visitor gets. It has **no rights on the table at
all**, so a request from a stranger is refused before row level security is even
consulted. That is why the direct check comes back `permission denied for table
flights` rather than an empty list.

### Lock two — row level security

```sql
alter table public.flights enable row level security;

create policy flights_select_own on public.flights
  for select to authenticated using ((select auth.uid()) = user_id);

create policy flights_insert_own on public.flights
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy flights_update_own on public.flights
  for update to authenticated using ((select auth.uid()) = user_id)
                              with check ((select auth.uid()) = user_id);

create policy flights_delete_own on public.flights
  for delete to authenticated using ((select auth.uid()) = user_id);
```

Four policies, one per verb, all scoped `to authenticated`. `auth.uid()` is read
out of the verified token — the browser cannot set it or argue with it.

`using` decides which rows you are allowed to *see or touch*. `with check`
decides what a row is allowed to *look like afterwards*. Both are needed on
`update`: without `using` a neighbour could edit your row, and without
`with check` you could edit your own row into being somebody else's.

---

## Ownership comes from the token, not the request body

A policy that compares `auth.uid()` to `user_id` is only as good as `user_id`
being honest. So the browser is not trusted to supply it:

```sql
create or replace function public.flights_guard()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is null then
      raise exception 'flights: not signed in' using errcode = '42501';
    end if;
    new.user_id := auth.uid();      -- whatever was sent is discarded
  else
    new.user_id := old.user_id;     -- an update cannot hand the row away
  end if;
  ...
end $$;
```

It also normalises the input — trims the text, upper-cases the codes and the
seat, turns empty strings into `null` — and refuses a `photo_path` that points
anywhere but the member's own folder.

`security invoker`, not `security definer`, so the function has no powers of its
own. `set search_path = ''` so nothing can be shadowed underneath it.

---

## Sharing, without loosening the table

Ticket 14 asks for one flight to be openable by a link. The obvious way is to
change the read policy to:

```sql
using (auth.uid() = user_id or is_public)     -- not what this project does
```

That is wrong three times over. `public.flights` becomes readable by strangers,
so *"only the owner can read this table"* stops being true. A signed-out visitor
can list every public row in the database, not just the one they were sent. And
worst of all, a shared row hands over **the private note** along with everything
else, because a policy grants access to a row, not to some of its columns.

So the table was left exactly as strict as it was, and sharing is a separate,
narrow door:

```sql
create or replace function public.shared_flight(share_id uuid)
returns table (flight_no text, airline text, from_iata text, to_iata text,
               flown_on date, aircraft text, seat text, shared_at timestamptz)
language sql security definer stable set search_path = '' as $$
  select f.flight_no, f.airline, f.from_iata, f.to_iata,
         f.flown_on, f.aircraft, f.seat, f.shared_at
  from public.flights f
  where f.id = share_id and f.is_public
$$;

revoke all on function public.shared_flight(uuid) from public;
grant execute on function public.shared_flight(uuid) to anon, authenticated;
```

One row, by id, only if its owner marked it public, and only the columns that
belong on a boarding pass. `note` is not among them and cannot be. `user_id` is
not among them either, so a link does not identify its owner.

This is a `security definer` function that `anon` may execute, which the Supabase
security advisor flags as a category of risk — correctly, in general. It is
deliberate here, and it is safe for the reason the general warning exists to
check: the function takes one opaque id, filters on `is_public`, and returns a
fixed, narrow column list. It cannot be persuaded to return anything else.

Every row is private by default. Nothing is shared unless the owner switches it
on, and switching it off kills the link immediately.

---

## Photographs

The bucket is **private**. A public bucket would have undone the whole evening:
the policy on the table would still have held while the photographs sat on open
URLs beside it.

Objects are named `<owner uuid>/<flight id>.<ext>`, and all four storage policies
check that first path segment against the token:

```sql
create policy flight_photos_read_own on storage.objects
  for select to authenticated
  using (bucket_id = 'flight-photos'
         and (storage.foldername(name))[1] = ((select auth.uid())::text));
```

A picture reaches the page through a signed link that expires, never a public
address. Deleting a flight deletes its file.

---

## The evidence

Run before the site existed, so nothing about the result depends on the browser.

### A signed-out stranger, asking the database directly

With the publishable key and no token, against the live project:

```
GET  /rest/v1/flights?select=*   →  401  permission denied for table flights
POST /rest/v1/flights            →  401  permission denied for table flights
GET  with a forged Bearer token  →  401  Expected 3 parts in JWT
```

### A signed-in neighbour

Simulated inside Postgres by switching role and claims, so it is the database's
own answer and not a filtered list from the app:

| What the neighbour tried | Rows |
|---|---|
| read the owner's flights | **0** |
| edit them | **0** |
| delete them | **0** |

### A browser that lies about who owns a row

An insert that deliberately claimed a different `user_id`:

| | |
|---|---|
| `user_id` sent by the client | `00000000-0000-0000-0000-0000000000bb` |
| `user_id` actually stored | the real owner from the token |
| owner overwritten by the trigger | **yes** |

Input normalisation in the same insert: `' ku 681 '` → `KU 681`, `'kwi'` → `KWI`,
`'32a'` → `32A`, `'  rls proof row  '` → `rls proof row`.

### The share door

| Request | Result |
|---|---|
| `POST /rest/v1/rpc/shared_flight` with a public row's id | `200` — the boarding-pass columns, **no note** |
| `GET /rest/v1/flights?id=eq.<that same row>` | `401` permission denied |
| `POST …/shared_flight` with an id that is not public | `200` `[]` |

The middle line is the important one: even for a row the owner deliberately
shared, the table itself still refuses.

### What the master key sees

Reading as the project owner, over the management connection, returns every row.
That is not a hole — the person who owns the building always has a master key.
A lock stops the neighbour, not the owner. It is the reason not to put anything
in a website you would not hand to whoever runs it.

---

## The two-account test, for anybody re-running it

1. Sign in as account A. Add a flight with something recognisable in the note.
2. Open a different browser, or a private window, and create account B.
3. B's locker is empty. Not filtered — empty.
4. Sign out entirely and open `/logbook`. You are sent to `/login`.
5. Then the part that matters: ask the database directly, with no token.

```bash
curl -s "https://<project-ref>.supabase.co/rest/v1/flights?select=*" \
     -H "apikey: sb_publishable_…"
```

Two accounts holding different things is not evidence on its own — a filtered but
unlocked app looks exactly the same. Step 5 is the evidence.
