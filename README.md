# Revive Agent Personalization: prototype

Clickable prototype of the new agent product: Revive as the *opportunity layer* on top of the agent's CRM and MLS.
Everything is a **Property** or a **Person**; every surface serves one loop: Find → Understand → Act → Track → Earn.

All data is sample data in `src/data/`. No backend.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
```

Deploys as a static SPA (Vercel: `vercel.json`; Netlify: `public/_redirects`).

`node scripts/build-preview.mjs` builds a single self-contained HTML file with hash routing
(`preview/revive-prototype.html`) for hosted previews where the page can't load its own script files or rewrite URLs.

## Demo controls

- **Demo bar** (top): switch *New agent · 0 deals / Active · 1 deal / Partner · 2+ deals*. Everything re-renders instantly.
- **Reset demo** clears connections, stage changes, claims and activity (keeps the current tier).
- **Design** (New agent only): compare three ways to tie the Home search to the map:
  A · Map first (search floats on the map; sample = photo pins with a callout),
  B · Split view (search + results panel beside the map; sample = numbered list ↔ numbered pins),
  C · Docked (search is the map's header; sample = neighbourhood bubbles).
- Search anywhere: sidebar **Search**, `/` or `⌘K` opens the search palette (there is no top bar).
- New agents start with nothing connected. Try a license number like `02134589` (finds 2 listings) and
  “Connect Follow Up Boss” (adds 12 contacts).
- Deep links: `/?tier=partner` pins a tier; `?demo=0` hides the demo bar for screenshots (`?demo=1` brings it back).
- Search: `/` or `⌘K`. Try “Oak”, “Sarah”, or an unknown address like “55 Fair Oaks Ave”.

## Where things live

| Path | What |
|---|---|
| `src/data/` | `properties.ts`, `people.ts`, `referrals.ts`, `tiers.ts` (per-tier copy and sample earnings) |
| `src/data/contacts.ts` | Michelle's CRM: the 12 contacts from the Contacts page, with their CRM history |
| `scripts/import-contacts.mjs` | Re-extracts contacts, photos, map tiles, logo and avatar from `reference/Your_Contacts.html` |
| `src/components/map/BaseMap.tsx` | Map with bundled OpenStreetMap tiles (zoom 10–14); `VITE_MAP_TILES_URL` switches to a live tile API |
| `src/lib/urgency.ts` | “Who to call” scoring: Contacts-page triggers + listings, lead form, referrals; hard stops first |
| `src/lib/opportunities.ts` | Builds the opportunity list for the current tier: stage, urgency, tags, contextual CTA |
| `src/store/demo.ts` | The only state: tier, stage overrides, claimed referrals, referral updates, activity |
| `src/components/opportunity/OpportunityCard.tsx` | The one card used everywhere |
| `src/styles/tokens.css` | Revive tokens mapped onto the shadcn theme variables |

## Build phases

- [x] **Phase 1: Shell + Home + tiers.** Sidebar, top-bar search, demo bar, Home for all three tiers, routing.
  Home v2: search hero and “We found N opportunities” for new agents, Revive status card, real map.
- [ ] Phase 2: Opportunities (list / pipeline, filters), Property page tabs, Person page, share / start project / claim dialogs.
- [ ] Phase 3: Map + mobile (Nearby, geolocation, bottom sheet). Deploy.
- [ ] Phase 4: Polish: simulated homeowner open, “Run Revive AI” loading state, transitions, demo script.

## Notes for phase 1 review

- Home numbers are derived, not hard-coded: “Opportunity value” = sum of top upside across opportunities marked
  *Call this week* or *Reach out this month* (with the Contacts book: $1.09M · 10 for New/Active, $1.19M · 11 for Partner).
- Claiming the Harbor View referral removes the hero, adds the card to the feed as *Interested*, and raises the
  “waiting on your update” count (Revive expects a status update on every claimed referral).
- Share / Propose CTAs route to the Property page tab where the action will live; dialogs arrive in phase 2.
## Data, map and photos

- **Book:** the agent's CRM contacts are the 12 records from the Contacts page (`reference/Your_Contacts.html`),
  ranked by the same rules. The brief's listings (123 Main, 250 Elm), lead-form lead (412 Oak),
  Revive referrals (77 Harbor View, 16 Laurel, 31 Arden) and project (9 Cypress) are added on top.
  The brief's contact story (18 Birchwood / Sarah Kim) is Maya Chen at 1847 Las Lunas St.
- **Map:** OpenStreetMap tiles bundled with the app, the same tiles the Contacts page embeds. Hosted
  previews block images from other sites, so a live tile API can't load there. For a deployed build, set
  `VITE_MAP_TILES_URL` to any XYZ tile template (MapTiler, Stadia, Mapbox) to use live tiles.
- **Photos are illustrative.** They come from the Contacts page's photo set (about 12 stock images reused),
  not from the actual addresses. For real per-address photos: Google Street View Static API (any address,
  needs an API key) or MLS listing photos through the agent's MLS (RESO Web API) for listings.
  Check Google's terms before storing Street View images in a static build.
