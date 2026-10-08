import { Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import avatar from '@/assets/avatar-michelle.jpg'
import { Button } from '@/components/ui/button'
import { AGENT } from '@/data/tiers'
import { useDemo } from '@/store/demo'

// A client-ready before & after: drag to compare, then download a branded image to send or post.

const W = 1200
const H = 900

const load = (src: string) =>
  new Promise<HTMLImageElement>((ok, fail) => {
    const i = new Image()
    i.onload = () => ok(i)
    i.onerror = fail
    i.src = src
  })

/** Draw an image covering a box, like object-fit: cover. */
function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const r = Math.max(w / img.width, h / img.height)
  const sw = w / r
  const sh = h / r
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h)
}

async function download(before: string, after: string, title: string, sub: string) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#1c2e58'
  ctx.fillRect(0, 0, W, H)
  const [b, a, me] = await Promise.all([load(before), load(after), load(avatar)])
  const top = 150
  const ph = 600
  cover(ctx, b, 40, top, (W - 100) / 2, ph)
  cover(ctx, a, 60 + (W - 100) / 2, top, (W - 100) / 2, ph)
  ctx.font = '600 22px Poppins, sans-serif'
  const tag = (t: string, x: number, bg: string) => {
    const w = ctx.measureText(t).width + 28
    ctx.fillStyle = bg
    ctx.fillRect(x, top + ph - 54, w, 38)
    ctx.fillStyle = '#fff'
    ctx.fillText(t, x + 14, top + ph - 27)
  }
  tag('BEFORE', 60, 'rgba(0,0,0,.6)')
  tag('AFTER', 80 + (W - 100) / 2, '#3e62b6')
  ctx.fillStyle = '#04c8aa'
  ctx.font = '600 22px Poppins, sans-serif'
  ctx.fillText('SEE IT RENOVATED', 40, 62)
  ctx.fillStyle = '#fff'
  ctx.font = '600 44px Poppins, sans-serif'
  ctx.fillText(title, 40, 116)
  ctx.save()
  ctx.beginPath()
  ctx.arc(76, top + ph + 75, 36, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(me, 40, top + ph + 39, 72, 72)
  ctx.restore()
  ctx.fillStyle = '#fff'
  ctx.font = '600 26px Poppins, sans-serif'
  ctx.fillText(AGENT.name, 132, top + ph + 68)
  ctx.fillStyle = 'rgba(255,255,255,.7)'
  ctx.font = '400 20px Poppins, sans-serif'
  ctx.fillText(`${sub} · DRE #02134589`, 132, top + ph + 100)
  const link = document.createElement('a')
  link.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-before-after.png`
  link.href = c.toDataURL('image/png')
  link.click()
}

export function RvShareCard({ id }: { id: string }) {
  const d = useDemo((s) => s.renovisions[id])
  const [pos, setPos] = useState(50)
  const [busy, setBusy] = useState(false)
  if (!d) return null
  const p = d.pairs[0]
  const title = d.address ? `${d.address}, renovated` : 'Your home, renovated'
  return (
    <div className="overflow-hidden rounded-2xl bg-navy p-4 text-white shadow-card">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-[var(--teal)] uppercase">See it renovated</p>
      <p className="mt-0.5 text-[18px] font-semibold">{title}</p>
      {/* drag to compare */}
      <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-xl select-none">
        <img src={p.after} alt={`After, ${d.style}`} className="absolute inset-0 size-full object-cover" />
        <img src={p.before} alt="Before" className="absolute inset-0 size-full object-cover" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
        <span className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} aria-hidden="true">
          <span className="absolute top-1/2 left-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[13px] font-bold text-navy shadow">‹›</span>
        </span>
        <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold">Before</span>
        <span className="absolute right-2 bottom-2 rounded-md bg-[var(--brand-primary)] px-1.5 py-0.5 text-[11px] font-semibold">After · {d.style}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Compare before and after"
          className="absolute inset-0 size-full cursor-ew-resize opacity-0"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <img src={avatar} alt="" className="size-8 rounded-full object-cover" />
          <span className="text-[12.5px] leading-4">
            <b className="font-semibold">{AGENT.name}</b>
            <span className="block text-white/70">{d.style} · DRE #02134589</span>
          </span>
        </span>
        <Button
          size="sm"
          className="h-9 bg-white text-navy hover:bg-white/90"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await download(p.before, p.after, title, d.style)
              toast.success('Before & after downloaded', { description: 'Ready to text, email or post.' })
            } catch {
              toast.error('Couldn’t make the image', { description: 'One of the photos couldn’t be read. Try another photo.' })
            }
            setBusy(false)
          }}
        >
          <Download /> Download
        </Button>
      </div>
    </div>
  )
}
