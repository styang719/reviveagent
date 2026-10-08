import { properties } from '@/data/properties'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'
import type { ChatMessage, FlowStep } from './ai'
import { buildReport, draftFromAddress, matchProperty, mlsPhotos, reportIdFor, RV_STYLES, type CreatedProject, type ProjectDraft, type RenoVisionDesign, type RenoVisionDraft, type ReportDraft } from './flows'
import { photoUrl } from './assets'
import case1 from '@/assets/cases/case-1.jpg'
import case2 from '@/assets/cases/case-2.jpg'
import case3 from '@/assets/cases/case-3.jpg'
import case4 from '@/assets/cases/case-4.jpg'
import case5 from '@/assets/cases/case-5.jpg'
import case6 from '@/assets/cases/case-6.jpg'

// Drives the guided Revive AI conversations. Each step: freeze the step the agent just completed,
// echo their answer as a message, then ask the next question (often as an interactive card).

let seq = 0
const uid = () => `m${Date.now()}-${seq++}`
const ui = () => useUi.getState()
const demo = () => useDemo.getState()

const say = (text: string, step?: FlowStep, refId?: string): ChatMessage => ({
  id: uid(),
  role: 'ai',
  blocks: [{ kind: 'text', text }, ...(step ? [{ kind: 'flow' as const, step, refId }] : [])],
})
const user = (text: string) => ui().addChat({ id: uid(), role: 'user', text })

/** Freeze the latest open step of this kind so it reads as done. */
function close(step: FlowStep) {
  const m = [...ui().chat].reverse().find((x) => !x.answered && x.blocks?.some((b) => b.kind === 'flow' && b.step === step))
  if (m) ui().patchChat(m.id, { answered: true })
}

function patchReport(patch: Partial<ReportDraft>) {
  const f = ui().flow
  if (f?.report) ui().setFlow({ ...f, report: { ...f.report, ...patch } })
}
function patchProject(patch: Partial<ProjectDraft>) {
  const f = ui().flow
  if (f?.project) ui().setFlow({ ...f, project: { ...f.project, ...patch } })
}

// ---------------- Generate a Revive AI report ----------------

export function startReport(prefill?: { propertyId?: string; address?: string }) {
  ui().setPanel(null)
  const p = prefill?.propertyId ? properties.find((x) => x.id === prefill.propertyId) : undefined
  const address = p ? `${p.address}, ${p.city}` : prefill?.address
  ui().addChat({ id: uid(), role: 'user', text: 'Generate a Revive AI report' })
  if (address) {
    ui().setFlow({ kind: 'report' })
    reportAddress(address, true)
    return
  }
  ui().setFlow({ kind: 'report', awaiting: 'address' })
  ui().addChat(say('Let’s build a Revive AI report. What’s the property address?'))
}

export function reportAddress(text: string, silent = false, entry?: 'home') {
  if (!silent) user(text)
  const draft = draftFromAddress(text)
  ui().setFlow({ kind: 'report', report: draft, entry })
  ui().addChat(
    say(
      draft.propertyId
        ? `Found it. Here’s what the public record says about ${draft.address}. Anything to correct?`
        : `I found ${draft.address} in public records. Check the details; they drive the estimate.`,
      'report-details',
    ),
  )
}

export function confirmDetails(d: Partial<ReportDraft>) {
  close('report-details')
  patchReport(d)
  const r = ui().flow?.report
  user(`${r?.beds ?? '–'} bd · ${r?.baths ?? '–'} ba · ${r?.sqft?.toLocaleString() ?? '–'} sqft · built ${r?.yearBuilt ?? '–'}. Looks right.`)
  ui().addChat(say(`I found ${r?.address ?? 'this home'} listed online. Select the photos that show it today, or add your own.`, 'report-photos'))
}

export function confirmPhotos(photos: string[]) {
  close('report-photos')
  patchReport({ photos })
  user(`Use ${photos.length} photo${photos.length === 1 ? '' : 's'}`)
  if (ui().flow?.entry === 'home') ui().addChat(say(`What can I help you with on ${ui().flow?.report?.address ?? 'this home'} today?`, 'home-intent'))
  else ui().addChat(say('Two quick questions so I can pick the right scenarios.', 'report-questions'))
}

// ---------------- Search a home (from the Home search) ----------------
// Confirm the home and its photos first, then ask what the agent wants; only then branch into a
// report or a project, with the questions that one needs.

export function startHome(address: string) {
  ui().setPanel(null)
  user(address)
  reportAddress(address, true, 'home')
}

/** "Discuss a property": ask which home, then the same steps as the Home search (details, photos, what can I help with). */
export function startDiscuss() {
  ui().setPanel(null)
  user('Discuss a property')
  ui().setFlow({ kind: 'report', awaiting: 'address', entry: 'home' })
  ui().addChat(say('Happy to talk it through. Which home is it? Type the address and I’ll pull it up.'))
}

export const INTENTS = [
  { key: 'sell', label: 'Sell the house', body: 'Renovate or prep before listing, so it sells for more.' },
  { key: 'flip', label: 'Flip the house', body: 'Revive buys, renovates and resells; the owner shares the upside.' },
  { key: 'stay', label: 'Refer my client to renovate to stay', body: 'Upgrades for owners staying put, with flexible payment.' },
  { key: 'report', label: 'Generate a Revive AI report', body: 'Value today, upside by product and ADU room, to share.' },
] as const
export type Intent = (typeof INTENTS)[number]['key']

export function chooseIntent(intent: Intent) {
  close('home-intent')
  const f = ui().flow
  const draft = f?.report
  if (!draft) return
  user(INTENTS.find((x) => x.key === intent)!.label)
  if (intent === 'report') {
    ui().addChat(say('Two quick questions so I can pick the right scenarios.', 'report-questions'))
    return
  }
  // the confirmed details and photos ride along; they're saved with the project when it's submitted
  const pid = draft.propertyId ?? reportIdFor(`${draft.address}, ${draft.city}`)
  ui().setFlow({ kind: 'project', entry: 'home', report: draft, project: { propertyId: pid, address: draft.address, city: draft.city } })
  if (intent === 'sell') {
    ui().setFlow({ ...ui().flow!, choices: ['Renovate to Sell', 'Sell 360'] })
    ui().addChat(say('Two ways Revive can help sell it. Which fits your client?', 'project-product'))
    return
  }
  patchProject({ product: intent === 'flip' ? 'Flip 360' : 'Renovate to Stay' })
  ui().addChat(say('A few details so Revive can review it quickly.', 'project-details'))
}

export function answerQuestions(selling: string, goal: string) {
  close('report-questions')
  patchReport({ selling, goal })
  user(`Selling: ${selling}. What matters most: ${goal}.`)
  ui().addChat(say('Generating your report…', 'report-progress'))
  const tid = ui().activeId
  setTimeout(() => inThread(tid, finishReport), 3600)
}

/**
 * Finish a delayed step in the conversation that started it, even if the agent has since
 * opened another chat. The result only takes over the screen if that chat is still open.
 */
function inThread(tid: string, fn: (onScreen: boolean) => void) {
  const s = ui()
  if (s.activeId === tid) return fn(true)
  const back = s.activeId
  s.openThread(tid)
  fn(false)
  if (ui().threads.some((t) => t.id === back)) ui().openThread(back)
  else ui().clearChat() // the chat they were on was still empty
}

function finishReport(onScreen: boolean) {
  close('report-progress')
  const draft = ui().flow?.report
  if (!draft) return
  const report = buildReport(draft)
  demo().addReport(report)
  ui().setFlow(null)
  ui().addChat(say(`Your Revive AI report for ${report.address} is ready.`, 'report-ready', report.id))
  if (onScreen) handOff('report', report.id)
}

// ---------------- Start a Revive project ----------------

export function startProject(prefill?: { propertyId?: string }) {
  ui().setPanel(null)
  ui().addChat({ id: uid(), role: 'user', text: 'Start a Revive project' })
  const id = prefill?.propertyId
  if (id) {
    const known = properties.find((x) => x.id === id)
    const rep = demo().reports[id]
    const address = known?.address ?? rep?.address
    if (address) {
      ui().setFlow({ kind: 'project', project: { propertyId: id, address, city: known?.city ?? rep?.city ?? '' } })
      askProduct()
      return
    }
  }
  ui().setFlow({ kind: 'project', awaiting: 'address' })
  ui().addChat(say('Let’s start a Revive project. Which property? Pick one below or type an address.', 'project-property'))
}

export function projectProperty(propertyId: string | undefined, typed?: string) {
  close('project-property')
  let pid = propertyId
  let address = ''
  let city = ''
  if (pid) {
    const known = properties.find((x) => x.id === pid)
    const rep = demo().reports[pid]
    address = known?.address ?? rep?.address ?? ''
    city = known?.city ?? rep?.city ?? ''
  } else if (typed) {
    const known = matchProperty(typed)
    const draft = draftFromAddress(typed)
    pid = known?.id ?? reportIdFor(`${draft.address}, ${draft.city}`)
    address = known?.address ?? draft.address
    city = known?.city ?? draft.city
    // a project needs the home's numbers: make the report quietly if there isn't one
    if (!known && !demo().reports[pid]) demo().addReport(buildReport(draft), true)
  }
  user(typed ?? `${address}, ${city}`)
  ui().setFlow({ kind: 'project', project: { propertyId: pid!, address, city } })
  askProduct()
}

function askProduct() {
  const pr = ui().flow?.project
  const rep = pr ? demo().reports[pr.propertyId] : undefined
  ui().addChat(
    say(
      rep
        ? `Based on the report for ${pr?.address}, here’s the product I’d start with. You can pick another.`
        : `Which Revive product fits ${pr?.address}? I’ve marked the one I’d start with.`,
      'project-product',
    ),
  )
}

export function chooseProduct(product: string) {
  close('project-product')
  patchProject({ product })
  user(product)
  ui().addChat(say('A few details so Revive can review it quickly.', 'project-details'))
}

export function projectDetails(d: { timeline: string; occupancy: string; homeowner?: string }) {
  close('project-details')
  patchProject(d)
  user(`${d.timeline} · ${d.occupancy}${d.homeowner ? ` · Homeowner: ${d.homeowner}` : ''}`)
  ui().addChat(say('Here’s what I’ll send to Revive. Property details, photos and the Revive AI report are included.', 'project-review'))
}

export function submitProject() {
  close('project-review')
  user('Submit the project')
  ui().addChat(say('Submitting to Revive…', 'project-progress'))
  const tid = ui().activeId
  setTimeout(() => inThread(tid, (onScreen) => {
    close('project-progress')
    const d = ui().flow?.project
    if (!d?.product || !d.timeline || !d.occupancy) return
    // a project needs the home's numbers: keep them as a report behind it, without announcing one
    const draft = ui().flow?.report
    if (draft && !draft.propertyId && !demo().reports[d.propertyId]) demo().addReport(buildReport(draft), true)
    const project: CreatedProject = { ...d, product: d.product, timeline: d.timeline, occupancy: d.occupancy, id: `pj-${Date.now()}`, createdAt: Date.now() }
    demo().addProject(project)
    ui().setFlow(null)
    ui().addChat(say(`Project submitted. Revive reviews it within 48 hours; you’ll get the offer terms here and by email.`, 'project-ready', project.propertyId))
    if (onScreen) handOff('project', project.propertyId)
  }), 1800)
}

// ---------------- RenoVision: see a home redesigned ----------------
// Pick a home (one on record, or type an address) or skip straight to photos; choose photos, choose a
// style, generate. Designs for a home are saved on that home; designs from loose photos are saved to the
// agent's library in Marketing center.

const AFTERS = [case1, case2, case3, case4, case5, case6]

function patchRv(patch: Partial<RenoVisionDraft>) {
  const f = ui().flow
  if (f?.rv) ui().setFlow({ ...f, rv: { ...f.rv, ...patch } })
}

export function startRenovision() {
  ui().setPanel(null)
  user('Visualize a renovation with RenoVision')
  ui().setFlow({ kind: 'renovision', awaiting: 'address', rv: { photos: [] } })
  ui().addChat(say('Let’s see it renovated. Which home is it? Pick one of yours, type an address, or skip and just use photos.', 'rv-source'))
}

export function rvHome(propertyId?: string, typed?: string) {
  close('rv-source')
  const known = propertyId ? properties.find((p) => p.id === propertyId) : typed ? matchProperty(typed) : undefined
  const rep = propertyId ? demo().reports[propertyId] : undefined
  const draft = !known && !rep && typed ? draftFromAddress(typed) : undefined
  const id = known?.id ?? rep?.id ?? (draft ? reportIdFor(`${draft.address}, ${draft.city}`) : undefined)
  const address = known?.address ?? rep?.address ?? draft?.address ?? typed ?? ''
  const city = known?.city ?? rep?.city ?? draft?.city ?? ''
  const photos = rep?.photos.length ? rep.photos : known ? mlsPhotos(known.address, known.photo) : (draft?.photos ?? [])
  // the home needs a record so its designs have a page to live on (and it shows on Homes)
  if (id) ensureHome(id, typed ?? `${address}, ${city}`)
  user(typed ?? `${address}, ${city}`)
  ui().setFlow({ kind: 'renovision', rv: { propertyId: id, address, city, photos } })
  ui().addChat(say(`I found photos of ${address}. Pick the ones to redesign, or add your own.`, 'rv-photos'))
}

export function rvPhotosOnly() {
  close('rv-source')
  user('Just use photos')
  ui().setFlow({ kind: 'renovision', rv: { photos: [] } })
  ui().addChat(say('Upload photos, or pick from ones you already have in Revive.', 'rv-photos'))
}

export function rvPhotos(picked: string[]) {
  close('rv-photos')
  patchRv({ picked })
  user(`Use ${picked.length} photo${picked.length === 1 ? '' : 's'}`)
  ui().addChat(say('Which design style?', 'rv-style'))
}

export function rvStyle(style: string) {
  close('rv-style')
  patchRv({ style })
  user(style)
  ui().addChat(say('Generating with RenoVision…', 'rv-progress'))
  const tid = ui().activeId
  setTimeout(
    () =>
      inThread(tid, () => {
        close('rv-progress')
        const d = ui().flow?.rv
        if (!d?.picked?.length || !d.style) return
        const k = RV_STYLES.findIndex((x) => x.name === d.style)
        const design: RenoVisionDesign = {
          id: `rv-${Date.now()}`,
          propertyId: d.propertyId,
          address: d.address,
          style: d.style,
          pairs: d.picked.map((before, i) => ({ before, after: AFTERS[(Math.max(0, k) + i) % AFTERS.length] })),
          createdAt: Date.now(),
          threadId: ui().activeId,
        }
        demo().addRenovision(design)
        ui().setFlow(null)
        ui().addChat(
          say(
            d.address ? `Here’s ${d.address} in ${d.style}. Saved to ${d.address}, with its Revive AI report.` : `Here they are in ${d.style}. They’re saved in this conversation; add them to a home to keep them with it.`,
            'rv-ready',
            design.id,
          ),
        )
      }),
    3200,
  )
}

/** After a design: a branded before & after the agent can download and send to their client. */
export function rvShare(designId: string) {
  user('Create a before & after to share with my client')
  ui().addChat(say('Here’s a branded before & after. Drag the slider to compare, then download it to text, email or post.', 'rv-share', designId))
}

/** A home with designs belongs on Homes; make sure it has a record (quietly, no report announced). */
function ensureHome(id: string, address: string) {
  if (demo().reports[id]) return
  const d = draftFromAddress(address)
  demo().addReport({ ...buildReport(d), id }, true)
}

/** Attach loose designs to a home; a new address becomes a home on record first. Returns the home's id. */
export function rvAttach(designId: string, home: { id?: string; address: string }) {
  let id = home.id
  let label = home.address.split(',')[0]
  if (!id) {
    const known = matchProperty(home.address)
    if (known) {
      id = known.id
      label = known.address
      ensureHome(known.id, `${known.address}, ${known.city}`)
    } else {
      const draft = draftFromAddress(home.address)
      id = reportIdFor(`${draft.address}, ${draft.city}`)
      label = draft.address
      if (!demo().reports[id]) demo().addReport(buildReport(draft), true)
    }
  }
  else ensureHome(id, home.address)
  demo().attachRenovision(designId, id, label)
  // file the conversation under that home too
  const tid = demo().renovisions[designId]?.threadId
  if (tid)
    useUi.setState((u) => ({
      threads: u.threads.map((t) => (t.id === tid ? { ...t, aboutId: id, aboutLabel: label, title: `RenoVision · ${label}` } : t)),
      ...(u.activeId === tid ? { activeHere: u.activeHere } : {}),
    }))
  return id
}

/** Photos the agent already has in Revive: their listings and reports, for the photos-only path. */
export function libraryPhotos(): string[] {
  const own = Object.values(demo().reports).flatMap((r) => r.photos)
  const listings = properties.filter((p) => p.source === 'listings' && p.photo).map((p) => photoUrl(p.photo)!)
  return [...new Set([...own, ...listings, ...mlsPhotos('library')])].slice(0, 8)
}

// ---------------- Hand-off: where the result opens (three versions) ----------------

function handOff(kind: 'report' | 'project', id: string) {
  const h = demo().handoff
  if (h === 'panel') ui().setPanel({ kind, id })
  // dock: stay put. The result card in the chat has the button to open the page, so finishing a report
  // never pulls the agent away from what they were doing.
}

/** Free text typed while a flow waits for an address. Returns true when the flow used it. */
export function flowInput(text: string) {
  const f = ui().flow
  if (!f) return false
  if (f.kind === 'report' && f.awaiting === 'address') {
    reportAddress(text, false, f.entry)
    return true
  }
  if (f.kind === 'renovision' && f.awaiting === 'address') {
    rvHome(undefined, text)
    return true
  }
  if (f.kind === 'project' && f.awaiting === 'address') {
    projectProperty(undefined, text)
    return true
  }
  return false
}
