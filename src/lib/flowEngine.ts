import { properties } from '@/data/properties'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'
import type { ChatMessage, FlowStep } from './ai'
import { buildReport, draftFromAddress, matchProperty, reportIdFor, type CreatedProject, type ProjectDraft, type ReportDraft } from './flows'

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

export function reportAddress(text: string, silent = false) {
  if (!silent) user(text)
  const draft = draftFromAddress(text)
  ui().setFlow({ kind: 'report', report: draft })
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
  ui().addChat(say('I pulled these photos from the MLS. Keep the ones that show the home today, and add your own if you have newer ones.', 'report-photos'))
}

export function confirmPhotos(photos: string[]) {
  close('report-photos')
  patchReport({ photos })
  user(`Use ${photos.length} photo${photos.length === 1 ? '' : 's'}`)
  ui().addChat(say('Two quick questions so I can pick the right scenarios.', 'report-questions'))
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
    if (!known && !demo().reports[pid]) demo().addReport(buildReport(draft))
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
    const project: CreatedProject = { ...d, product: d.product, timeline: d.timeline, occupancy: d.occupancy, id: `pj-${Date.now()}`, createdAt: Date.now() }
    demo().addProject(project)
    ui().setFlow(null)
    ui().addChat(say(`Project submitted. Revive reviews it within 48 hours; you’ll get the offer terms here and by email.`, 'project-ready', project.propertyId))
    if (onScreen) handOff('project', project.propertyId)
  }), 1800)
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
    reportAddress(text)
    return true
  }
  if (f.kind === 'project' && f.awaiting === 'address') {
    projectProperty(undefined, text)
    return true
  }
  return false
}
