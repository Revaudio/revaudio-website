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

---

## 10. Answers — reviewed and actioned, 2026-07-26 (Yoni's Windows session)

**1. Fragment move: done and live.** The worker now returns
`https://revaudio.net/<slug>#dl=<gate>&p=<id>`, and the modal reads `location.hash`, falling back to
`?dl=` so links minted before the switch keep working. A plain anchor (`#pricing`) is preserved
verbatim rather than round-tripped through `URLSearchParams` — that would have rewritten it to
`pricing=`, which is the one trap in this change.

| Repo | Commit | What |
|---|---|---|
| `Revlimiter` | `555b614` | `handleDownloadVerify` mints `#dl=` |
| `revaudio-website` | `4610ad5` | `TrialGateModal.astro` reads `location.hash` |
| `revaudio-shared` | `3ce7b3a` | wiki `distribute-release` — fragment is now the documented mint format |

Worker deployed (version `5f092b10-1566-4366-b292-0d2b81a3c13c`), site pushed and live, wiki mirror
rebuilt and deployed.

**2. TTL stays 24h.** The 30-day `rdlv` cookie is still set on verify, so a visitor who comes back
weeks later isn't actually stranded — the portal still lets them in, and re-registering from the
popup costs one email. A 30-day bearer credential in a URL is the worse trade even now that the URL
is a fragment, because the fragment is still in the user's history and paste buffer.

**3. `localhost` CORS entry stays.** Gating it behind an env check means another live edit to the
CORS path on the same day the flow shipped, for an endpoint that still refuses everything without a
valid gate token or cookie. Revisit when the worker next gets a real config pass.

**4. Nothing else changed before real traffic.** The known-open items from §6 are addressed below.

### Verification run this session

- **Site, 15 headless-Chromium assertions — all passing against the local build *and* against
  production.** Fragment opens the ready state with both platform buttons and the correct plugin
  name; token scrubbed from the address bar; legacy `?dl=` still works; `#pricing` neither opens the
  modal nor gets mangled; bare page stays shut; the buy-now trigger still opens the email form; the
  `.tg-form[hidden]` fix from §5 still holds; the button posts `{plugin, os, gate}` to the existing
  worker with no R2 key on the wire. The fragment survives the `/revlimiter` → `/revlimiter/` 301.
- **Worker, live post-deploy:** portal 200 (10,821 b, unchanged) · `/gas/mac` still gated (302 to
  the portal — the §7 regression did *not* come back) · no credential → `locked` · forged gate →
  `locked` · `os:"linux"` → rejected · expired verify link → 403 · preflight from a foreign origin →
  403, and a foreign-origin POST gets no `Access-Control-Allow-Origin` back.
- **`verify-license-integrity.js` ran on Windows — `RESULT: OK`.** All five checks green, including
  worker verify-exponent (3) == pubkey exponent (3) and a live canary `/activate` round-trip with
  the seat cleaned from KV afterwards. This closes the §6 "also not run" item.

### Still open

**The last leg is still unclicked.** Nobody has followed a real verify link end to end and confirmed
an installer streams. Everything around it is now proven on production, but that one human step
remains — and it is the only thing between here and calling this done.
