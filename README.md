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

The demo bar has four scenarios: **New agent · 0 deals** (nothing connected), **New agent · MLS & CRM connected** (license and CRM already connected, so Home shows the real listings and contacts), **Active · 1 deal** and **Partner · 2+ deals**.

- **Demo bar** (top): switch *New agent · 0 deals / Active · 1 deal / Partner · 2+ deals*. Everything re-renders instantly.
- **Reset demo** clears connections, stage changes, claims and activity (keeps the current tier).
- **Revive AI** (top of the sidebar, `/ai`): a chat about any home or anyone in the book. Answers are built
  from the sample data (`src/lib/ai.ts`): home value and upside, ADU fit, who to call, drafted notes.
  There is no separate search or top bar: Revive AI is the way to look anything up.
- **Guided flows in Revive AI** (`src/lib/flowEngine.ts`, `src/components/ai/FlowSteps.tsx`):
  *Generate a Revive AI report* (address → confirm details → pick MLS photos / add your own → client questions →
  report) and *Start a project* (property → product → timeline/occupancy → review → submit). Started from the
  Home to-dos, the Revive AI starters, or a property page (`/ai?flow=report|project&property=…`).
- **AI hand-off**: a finished report or project opens on its property page (Overview · Revive AI report ·
  Project · Marketing) and the conversation docks in the corner so the agent can keep going. (Link and side-panel
  versions were explored and set aside; the code paths remain behind `handoff` in the demo store.)
- **Properties** (`/properties`, was Projects): every home the agent is working on with Revive, in two
  sections: Revive projects (open the Project tab) and Revive AI reports (open the report tab).
- **Page context**: on a property page the docked chat is always available ("Ask Revive about …") and answers
  about that home: its value, the Revive scenarios, ADU room, a note to the owner, or starting a project or the
  full report. Naming another address or person still works.
- **Conversations**: every CTA that opens Revive AI with context (a Home to-do, Start a project on a property)
  starts a new conversation in the docked chat, without leaving the page; its expand button opens the full Revive
  AI page. The one exception is the Ask Revive search on Home: entering a question or an address there (or a
  prompt chip under it) goes to the Revive AI page.
- **Home search flow**: picking an address there doesn't assume a report. Revive AI confirms the home's details,
  shows the photos it found listed online (select or add more), then asks "What can I help you with today?":
  Sell the house (then Renovate to Sell or Sell 360), Flip the house (Flip 360), Refer my client to renovate to
  stay (Renovate to Stay), or Generate a Revive AI report. A project goes on to timing, occupancy and review; a
  report to its two questions. `startHome` / `chooseIntent` in `src/lib/flowEngine.ts`. Earlier ones are listed on the Revive AI page, ChatGPT style, named by
  what they're about (e.g. “Report · 55 Fair Oaks Ave”), and can be reopened or deleted. Kept for the browser
  session; Reset demo clears them.
- New agents start with nothing connected. Try a license number like `02134589` (finds 2 listings) and
  “Connect Follow Up Boss” (adds 12 contacts).
- Deep links: `/?tier=partner` pins a tier; `?demo=0` hides the demo bar for screenshots (`?demo=1` brings it back).

## Where a home's updates live

- **Opportunities** is the to-do list, laid out like the Contacts page (`reference/Your_Contacts.html`): search and Import contacts; four stat cards that each end in one action (Call this week, Likely sellers, Value to unlock with your commission, Unused land); filter chips with counts: All, Worth a conversation (default), Likely seller, Renovation, ADU room, Build (an ADU scenario with upside or a Flip 360); sort; the list uses the same cards as Home's Top opportunities (`OppRow`, responsive by container width) with the map beside it; on wide screens the page doesn't scroll, the list scrolls and the map stays put (pins say who, hover links pin and card, click opens the drawer). Homes with a submitted project leave the list, with a link to Properties.
- **Properties → Revive projects, empty**: “Have a property in mind?” with an AI address search (`StartWithRevive`); picking a home starts the Home-search flow in the docked chat (confirm the home, then sell, flip, refer to renovate to stay, or a report).
- **A home's Revive AI report tab** leads with **Lead activity** (`LeadActivity`: what the homeowner did with the report and emails: ran it on the lead form, viewed a section, opened or replied to an email), then **Top opportunities**: Renovate to Sell, ADU and Sell 360 side by side, each with a short intro, value increase and sq ft increase. A home that already has a report (`reportRun`, e.g. from the lead form) shows it without a Generate button.
- **Homes** (route `/properties`, formerly Properties; search at the top filters its projects and reports) is the record. The sidebar calls Home **Dashboard**. Each home's page holds the report, project, marketing and its activity. Its Revive AI conversations live with the bot: landing on the page, the docked chat picks up the last conversation about that home (the pencil button starts a new one), and on the Revive AI page the history is grouped by home address (threads carry `hereId` / `aboutId`; `threadHome` / `isAbout` in `src/store/ui.ts`).
- **Revive AI** is the tool. Its results save to the home, never only to the chat.
- **Home → Your Revive advisor** (`AdvisorCard`) sits in the right column in every scenario: Philip Philipson, with Schedule a call.

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
| `src/components/home/TopOpportunities.tsx` | Home's “Top opportunities this week”: 5 cards, each a checklist item read left to right (photo, address and contact, MLS listing / Contact label, selling score as a ring for homes not on the market (your listings show a Listed badge with days on market instead); value with the Revive upside; what Revive spots as tags: Listing issue, ADU room, Renovation; High / Medium / Low priority (from the why-now score) next to the source label; a mail button on the right). A card opens a details drawer (footer: Book a call to discuss with the Revive advisor, Revive AI report, mark done); ticks persist in `demo.checked` |
| `src/components/opportunity/MessageDialog.tsx` | The mail button on each top opportunity: a ready-to-send email from a template matching what Revive spotted (Listing issue, ADU room, Renovation), record details highlighted, editable body, branded attachments. Sending starts the outreach on the card instead of ticking it off: Emailed → opened (demo: ~4s) → replied (~11s). A reply highlights the card, moves it to the top, shows the reply with the intent Revive reads (Interested / Has a question / Not now) and next steps (Book a call with Revive, or Remind me in spring); “Reply with Revive’s draft” opens an answer drafted from the reply. State in `demo.outreach` |
| `src/components/opportunity/ContactTimeline.tsx` | The drawer's Contact history: a timeline of this session's emails, replies, calls and notes (in time order) above what the CRM already knew (Follow Up Boss history) or, for listings, the home's MLS events. Log a call, Add note and Message act right there. The drawer leads with Revive insights (each product's upside) |
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
