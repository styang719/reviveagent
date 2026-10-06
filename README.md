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
- **Reset demo** clears stage changes, claims and activity (keeps the current tier).
- Deep links: `/?tier=partner` pins a tier; `?demo=0` hides the demo bar for screenshots (`?demo=1` brings it back).
- Search: `/` or `⌘K`. Try “Oak”, “Sarah”, or an unknown address like “55 Fair Oaks Ave”.

## Where things live

| Path | What |
|---|---|
| `src/data/` | `properties.ts`, `people.ts`, `referrals.ts`, `tiers.ts` (per-tier copy and sample earnings) |
| `src/lib/urgency.ts` | “Who to call” scoring: Contacts-page triggers + listings, lead form, referrals; hard stops first |
| `src/lib/opportunities.ts` | Builds the opportunity list for the current tier: stage, urgency, tags, contextual CTA |
| `src/store/demo.ts` | The only state: tier, stage overrides, claimed referrals, referral updates, activity |
| `src/components/opportunity/OpportunityCard.tsx` | The one card used everywhere |
| `src/styles/tokens.css` | Revive tokens mapped onto the shadcn theme variables |

## Build phases

- [x] **Phase 1: Shell + Home + tiers.** Sidebar, top-bar search, demo bar, Home for all three tiers, routing.
- [ ] Phase 2: Opportunities (list / pipeline, filters), Property page tabs, Person page, share / start project / claim dialogs.
- [ ] Phase 3: Map + mobile (Nearby, geolocation, bottom sheet). Deploy.
- [ ] Phase 4: Polish: simulated homeowner open, “Run Revive AI” loading state, transitions, demo script.

## Notes for phase 1 review

- Home numbers are derived, not hard-coded: “Opportunity value” = sum of top upside across opportunities marked
  *Call this week* or *Reach out this month* ($338K · 4 for New/Active, $433K · 5 for Partner).
- Claiming the Harbor View referral removes the hero, adds the card to the feed as *Interested*, and raises the
  “waiting on your update” count (Revive expects a status update on every claimed referral).
- Share / Propose CTAs route to the Property page tab where the action will live; dialogs arrive in phase 2.
- Map tiles: CARTO Voyager (OpenStreetMap data), fine for a demo; swap for a keyed provider before wide sharing.
- Property photos are placeholders.
