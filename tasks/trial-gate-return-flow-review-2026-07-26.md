# Review: trial-gate return flow — verify link now lands back in the site popup

**For:** Yoni · **By:** Claude (Dan's Mac session) · **Date:** 2026-07-26
**Status:** built, tested, **deployed to production** — one leg unverified (see §6)
**Spans two repos + the wiki:**

| Repo | Commit | What |
|---|---|---|
| `revaudioplugins/Revlimiter` | `2ddc63a` | license worker — `+66 / -19` in `tools/RevLicenseKeygen/gumroad-worker/src/worker.js` |
| `revaudioplugins/revaudio-website` | `feefa83` | `src/components/TrialGateModal.astro` — `+178 / -3` |
| `revaudioplugins/revaudio-shared` | `c0e5046` | `wiki/pages/distribute-release.md` |

---

## 1. What Dan asked for

The trial pipeline should be: **popup opens → user goes to email to verify → the email link brings
him back to the popup, now showing Mac and Windows downloads.** Explicit constraint added on
approval: *"the two download buttons should be wired to the existing R2 worker and not create a new
worker"*, and *"keep the download portal"*.

## 2. What it did before

`handleDownloadVerify` recorded the lead, set the 30-day `rdlv` cookie, and `302`'d to `/download`
— **the worker's own portal page**, on `revlimiter-license.revaudio.workers.dev`. Both platforms
were there, but the user was ejected from revaudio.net onto a different domain with a different
shell mid-funnel. The popup itself dead-ended at "Check your inbox" and had no further states.

## 3. What it does now

```
popup (revaudio.net)  --POST /download/register-->  worker  --Resend-->  inbox
inbox link  -->  GET /download/verify?t=…  -->  302  -->  revaudio.net/<slug>?dl=<gate>&p=<id>
popup reopens in "ready" state  -->  [ MACOS ] [ WINDOWS ]
button  --POST /download {plugin, os, gate}-->  worker  -->  {url:"/dl?t=…"}  -->  R2 stream
```

Same worker, same R2 bucket, same KV lead bookkeeping. **No new service.** The `/download` portal is
untouched and still fully functional — the cookie is still set on verify, so it remains a working
fallback (verified post-deploy: still serving, 10,821 bytes, identical to pre-deploy).

Two smaller design calls inside that:

- **`POST /download` now accepts `{plugin, os}`** (os = `win`/`mac`) in addition to the original
  `{platform}`. The worker resolves the R2 platform key from its own `DL_PLUGINS` registry. Reason:
  the site never carries a copy of `BUILD_MAP`, so a release that renames a build can't leave the
  site pointing at a dead key. The portal's original `{platform}` call path is unchanged.
- **`sitePath` added per plugin** in `DL_PLUGINS` (`/revlimiter`, `/gas`, `/radio-roulette`). A
  plugin without it falls back to the old `/download` behaviour rather than 302'ing to a 404.

## 4. The decision most worth challenging: URL token, not cookie

The download buttons authenticate with a token in the URL (`?dl=`), **not** the `rdlv` cookie.

**Why the cookie cannot work here:** `rdlv` belongs to the *worker* origin. A cross-site `fetch`
from revaudio.net never sends a `SameSite=Lax` cookie, and switching it to `SameSite=None` doesn't
save it either — Safari's ITP blocks third-party cookies outright, and this is a Mac-heavy audience.
Side benefit: a URL token works when the verify mail is opened on a phone but registered on a
desktop, which the cookie never did.

**Properties:** same signed HMAC envelope as the cookie (`signEmailToken`, `REVL_PRIVATE_KEY`),
plugin-scoped, 24h TTL (`DL_RETURN_TTL`) vs the cookie's 30 days. Stripped from the address bar via
`history.replaceState` the moment the page reads it, so it isn't in browser history and isn't in the
`Referer` when the download navigation fires.

### ⚠️ Known weakness — flagging it rather than hiding it

**The token is in the query string, so it is written to server access logs** (GitHub Pages and
Cloudflare log path + query). `replaceState` cleans the browser, not the logs.

**Impact is low** — the token grants exactly one thing: downloading a *free* 14-day trial build for
one plugin, for 24 hours. It is not a license key, grants no purchase, no account, no PII beyond the
email already embedded in it. The pre-existing cookie was an equivalent bearer credential.

**Recommended fix (not applied — your call):** move it to a URL **fragment** — `Location:
…/revlimiter#dl=<token>&p=<id>`. Fragments are never transmitted to the server, which removes the
log exposure entirely. The browser preserves fragments across a 302, and the popup reads
`location.hash` instead of `location.search`. It's roughly a ten-line change on both sides. I did
not do it unilaterally because it changes a just-deployed live flow. **This is my top review item.**

### Other things a reviewer should poke at

1. **Cross-usability of the two credentials.** A `?dl=` token and an `rdlv` cookie are the same
   envelope, so either can be presented in place of the other. Both grant identical access to the
   same plugin's download, so there's no privilege escalation — but it is worth confirming you agree
   that's acceptable rather than accidental.
2. **TTL asymmetry.** Cookie 30 days, URL token 24 hours. A visitor who comes back a week later via
   the popup must re-register (the portal would still let them straight in). Deliberate — a 30-day
   credential in a URL felt worse than a small re-registration cost — but it *is* a UX regression
   versus the portal, and reasonable people could pick differently.
3. **CORS allow-list** (`DLREG_CORS`, pre-existing, now also covering `POST /download`):
   `revaudio.net`, `www.revaudio.net`, and a permissive `^http://localhost(:\d+)?$` for Astro dev.
   That localhost rule is live in production. Low impact for a free download; flagging because it's
   now on one more route than before.
4. **No rate limit on `POST /download`.** Pre-existing. `/download/register` is rate-limited 1/min
   per address; the download mint is not.
5. **`window.location.href` to the `/dl` URL.** Relies on `Content-Disposition: attachment` to keep
   the page put. Verified working. CSP is not a factor — top-level navigation isn't governed by
   `connect-src`, and the worker is already in `connect-src` for the fetch.

## 5. Bug found and fixed en route (pre-existing, unrelated to the feature)

`.tg-form { display: flex }` outranks the UA stylesheet's `[hidden] { display: none }`, so
`form.hidden = true` **never actually hid anything**. The "Check your inbox" confirmation has been
rendering on top of a still-live, still-submittable email form since that state shipped. Fixed with
`.tg-form[hidden] { display: none }`. Worth a glance for the same pattern elsewhere in the codebase.

## 6. Verification — what's proven and what isn't

**Site, automated (22 assertions, headless Chromium against a dev server, all passing):** ready state
opens from `?dl=&p=`; URL scrubbed; correct per-plugin title (RevLimiter *and* Radio Roulette, so the
name map is wired not hardcoded); email form hidden; both buttons visible; `os:"mac"` and `os:"win"`
posted correctly; no R2 platform key leaks from the site; the minted `/dl` URL is followed; expired
token falls back to the email form; and the original Buy-now trigger path still opens the email form
unchanged.

**Worker, live post-deploy:** portal still serves ✓ · CORS preflight open for revaudio.net, foreign
origin `403` ✓ · no credential → `{locked:true}` ✓ · **forged gate token → `{locked:true}`** ✓ ·
`os:"linux"` → rejected ✓ · bogus license key to `/activate` → clean rejection, no 500, so
`REVL_PRIVATE_KEY` is still bound and the licensing half is undisturbed ✓ · live registration from
revaudio.net → 200, Resend mail sent ✓.

**NOT verified — the last leg.** Clicking a real verify link and confirming an installer actually
streams. That needs a human with the inbox. A mail was sent to `hameatbach@gmail.com` and, as of this
writing, a 15-minute `wrangler tail` showed no `/download/verify` hit — so it hasn't been clicked
yet. (Tail confirmed working by hitting the worker while watching.) **This is the one gate still
open.**

**Also not run:** `verify-license-integrity.js` — needs `private_key.txt`, which is gitignored and
lives only on the Windows canonical clone. Must run there. The R2 ↔ `BUILD_MAP` liveness probe was
deliberately skipped: neither `BUILD_MAP` nor any R2 object was touched, and the 6h cron covers it.

## 7. Operational hazard worth knowing about

**The local Revlimiter clone was behind the deployed worker.** The commit closing the ungated
`/gas/mac|win` routes was on the remote but never pulled to this Mac. Deploying without pulling would
have silently *reopened* GAS's ungated downloads — a regression with no error message. Caught by
probing the live worker and noticing it disagreed with local source. Pulled and rebased before
deploying (the conflict was upstream deleting `GAS_MAP` next to my new constants).

**Takeaway for the team:** that worker source is touched from more than one machine, and
`wrangler deploy` silently ships whatever is in the working tree. Pull, and diff against live
behaviour, before deploying it.

The wiki's `distribute-release` page also still described those GAS routes as live; corrected in
`c0e5046`, along with the new flow and the popup leg added to the mandatory download-links gate.
Mirror rebuilt and deployed to wiki.revaudio.net.

## 8. Questions for you

1. Move the gate token to a URL fragment (§4)? I'd recommend yes.
2. Is 24h the right TTL for the return token, or should it match the cookie's 30 days?
3. Should the `localhost` CORS entry stay in production, or move behind an env check?
4. Anything you want changed before this gets exercised by real traffic?

## 9. Files to read

- `revaudio-website/src/components/TrialGateModal.astro` — whole component; the new script block is
  states 2–3, the URL read is at the bottom of the IIFE.
- `Revlimiter/tools/RevLicenseKeygen/gumroad-worker/src/worker.js` — `DL_PLUGINS` (+ `sitePath`,
  `DL_SITE_ORIGIN`, `DL_RETURN_TTL`), `handleDownloadVerify`, `handleDownloadRequest`, and the
  router's `/download` CORS block.
