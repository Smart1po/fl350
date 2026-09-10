# FL350

A private flight log. One account, one locker, and the database refuses to hand a
row to anybody else.

**Live:** https://fl350.vercel.app

---

## What it is

Every flight you have taken, kept as a boarding pass. The route, the aircraft, the
seat, a photograph if you have one, and a note only you can read.

| Page | Address | What it does |
|---|---|---|
| Home | `/` | What the product is, in one screen, with a real boarding pass on it |
| Door | `/login` | Create an account or come back to one |
| The locker | `/logbook` | **Gated.** Your flights, your globe, your numbers |
| A shared flight | `/f/<id>` | One flight its owner deliberately opened to a link |
| Nothing here | `/404` | For addresses that do not exist |

Opening `/logbook` signed out sends you to `/login` before any of the locker
paints — and the data is refused by the database as well, which is the part that
actually matters. See [THE-LOCK.md](THE-LOCK.md).

---

## The table

One table, `flights`, in the Supabase project `CUP`. One row per flight.

| Column | What it is for |
|---|---|
| `id` | the row's own name, so a flight can be edited or deleted without ambiguity |
| `user_id` | **the owner.** Filled by a trigger from the verified token, never from the browser |
| `flight_no` | the flight as printed on the ticket, e.g. `KU 681` |
| `airline` | who flew it — separate from the number, so airlines can be counted |
| `from_iata`, `to_iata` | departure and arrival, three letters, checked by the database |
| `flown_on` | the date it departed. A `date`, not a timestamp, because a flight is a day |
| `aircraft` | optional. The type, e.g. `A330-800neo` |
| `seat` | optional. A row number and one letter, so `32A` passes and `pizza` does not |
| `note` | **the private line.** The reason the lock has to hold |
| `is_public` | the owner opened this one flight to a share link. `false` for every row unless switched on |
| `shared_at` | when it was opened. Set by the database, cleared when sharing is switched off |
| `photo_path` | the key of a photograph inside a **private** bucket, always `<owner>/<flight>.<ext>` |
| `created_at`, `updated_at` | when the row was written and last touched. Set by the database |

---

## How it is built

No framework, no bundler, no build step, no npm. Three faces of type, one accent
colour, one radius. Open a page and it is already the finished thing.

```
index.html  login.html  logbook.html  share.html  404.html
vercel.json                 clean URLs, the share rewrite, and the security headers
api/config.js               hands the browser the database address from Vercel's env vars
assets/css/app.css          tokens, components, light and dark
assets/css/rtl.css          the interface mirrored for Arabic
assets/css/routeglobe.css   the globe
assets/css/windowseat.css   the window seat
assets/js/boot.js           theme, direction, and the gate — before the first paint
assets/js/config.js         where the database address comes from
assets/js/supabase.js       auth, rows, storage and the share door, by hand
assets/js/session.js        who is signed in
assets/js/ui.js             toasts, escaping, dates, distance, the switches
assets/js/strings.js        every visible word, in English and Arabic
assets/js/i18n.js           applies a language and a direction
assets/js/airports.js       IATA → city and coordinates; flight number → airline
assets/js/pass.js           the boarding pass, used by the locker and the share page
assets/js/routeglobe.js     an orthographic globe of your routes
assets/js/windowseat.js     the window seat, in stereo
assets/js/login.js          the door
assets/js/logbook.js        the locker
assets/js/share.js          the share page
```

`supabase-js` is not used. There is no bundler to import it with and no CDN in the
project, so every call is a plain `fetch` against the two Supabase HTTP endpoints —
which is what the library does for these operations anyway.

---

## The keys

Nothing about Supabase is committed. On the live site the browser asks
`/api/config`, which reads two environment variables from the Vercel project:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |

The publishable key is meant to ship to every visitor's browser; that is what it
is for. What protects the rows is the policy on the table, not secrecy about the
key. **The secret (`service_role`) key bypasses every policy and must never be
added to this project, this repository, or any variable the browser can reach** —
`api/config.js` refuses to serve a key that looks like one.

Environment variables only reach the **next** build. Change one, then redeploy.

### Working on it locally

`/api/config` only exists on Vercel. To open the site from a plain static server,
create `assets/js/config.local.js` — `.gitignore` already keeps it out:

```js
window.FL350_CONFIG = {
  url: 'https://YOUR-PROJECT-REF.supabase.co',
  key: 'sb_publishable_…'
};
```

`config.js` loads it only after `/api/config` has failed, so the live site never
touches it.

---

## Deploying

Push to `main`. Vercel builds and publishes. There is nothing to build, so a
deploy is a copy.

---

## Two honest limits

**The publishable key is in every visitor's browser.** That is normal and safe
here, because the policy is on. With row level security off, that same key really
would let anyone read every row — which is the whole point of the evening.

**Whoever runs a website can read its database.** No policy changes that. Keep
anything you would not hand to the person running the site out of it, including
this one.

---

Built for **AIFC Day 5 — Cornerstone: The Locker**, CODED × SACGC.
