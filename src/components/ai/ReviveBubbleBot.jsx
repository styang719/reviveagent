import { useId } from 'react'

/*
 * Revive AI's bubble bot, idle state.
 *
 * One SVG, CSS keyframes only (plus one SMIL rotation that drifts the opal rim). Every motion is a few pixels or
 * a percent of scale on its own slow, unrelated period, so the bot never visibly loops and never pulls the eye
 * from the text beside it:
 *
 *   float    5.6s   the whole bot rises 3px and settles; the shadow below shrinks and fades as it rises
 *   breathe  3.4s   squash and stretch from the base (0.99 ↔ 1.01), like a liquid bubble
 *   wobble   4.7s   a tiny skew, out of phase with the breath, so the membrane seems to ripple
 *   shimmer  3.9s   the specular highlights slide a pixel and pulse 0.8 ↔ 1 opacity
 *   blink    7.3s   one quick blink (scaleY 0.1) per cycle
 *   bubbles  6.1s, 8.3s   two tiny bubbles leave the chimney, rise ~10px and fade
 *
 * Everything stops under prefers-reduced-motion.
 */

// the house: soft roof, a chimney bump on the right roof slope, rounded eaves and base
const HOUSE =
  'M100 30C107 30 113 32.5 119 37L130 45.4C130.6 39 134.6 34 141 34C147.6 34 151.6 39 151.6 45.6V61.6L170.5 76.2C181 84.4 180 96.4 168.6 98C163.6 98.7 160 102.4 160 108.6V156C160 171 150.6 179 135.6 179H64.4C49.4 179 40 171 40 156V108.6C40 102.4 36.4 98.7 31.4 98C20 96.4 19 84.4 29.5 76.2L81 37C87 32.5 93 30 100 30Z'

const css = `
.rvb { --rvb-ease: cubic-bezier(.45,0,.55,1); }
.rvb-float   { animation: rvb-float 5.6s var(--rvb-ease) infinite; }
.rvb-shadow  { animation: rvb-shadow 5.6s var(--rvb-ease) infinite; }
.rvb-breathe { transform-box: fill-box; transform-origin: 50% 100%; animation: rvb-breathe 3.4s var(--rvb-ease) infinite; }
.rvb-wobble  { transform-box: fill-box; transform-origin: 50% 100%; animation: rvb-wobble 4.7s var(--rvb-ease) infinite; }
.rvb-shimmer { animation: rvb-shimmer 3.9s var(--rvb-ease) infinite; }
.rvb-sheen   { animation: rvb-sheen 6.4s var(--rvb-ease) infinite; }
.rvb-eyes    { transform-box: fill-box; transform-origin: 50% 50%; animation: rvb-blink 7.3s linear infinite; }
.rvb-companion { transform-box: fill-box; transform-origin: 50% 50%; animation: rvb-companion 4.9s var(--rvb-ease) infinite; }
.rvb-stray   { transform-box: fill-box; transform-origin: 50% 50%; opacity: 0; animation: rvb-stray 6.1s ease-out infinite; }
.rvb-stray-2 { animation-duration: 8.3s; animation-delay: 3.2s; }

@keyframes rvb-float   { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
@keyframes rvb-shadow  { 0%,100% { transform: scaleX(1); opacity: .55 } 50% { transform: scaleX(.86); opacity: .34 } }
@keyframes rvb-breathe { 0%,100% { transform: scale(1.01,.99) } 50% { transform: scale(.99,1.01) } }
@keyframes rvb-wobble  { 0%,100% { transform: skewX(-.7deg) scaleY(1) } 50% { transform: skewX(.7deg) scaleY(1.004) } }
@keyframes rvb-shimmer { 0%,100% { opacity: .8; transform: translate(0,0) } 50% { opacity: 1; transform: translate(1px,-.6px) } }
@keyframes rvb-sheen   { 0%,100% { opacity: .55; transform: translate(0,0) } 50% { opacity: .85; transform: translate(2px,1px) } }
@keyframes rvb-blink   { 0%,93%,100% { transform: scaleY(1) } 95% { transform: scaleY(.1) } 97% { transform: scaleY(1) } }
@keyframes rvb-companion { 0%,100% { transform: translate(0,0) } 50% { transform: translate(-1px,-2.5px) } }
@keyframes rvb-stray {
  0%   { opacity: 0;  transform: translate(0,0) scale(.6) }
  12%  { opacity: .9; transform: translate(0,-1px) scale(1) }
  70%  { opacity: .5 }
  100% { opacity: 0;  transform: translate(3px,-10px) scale(1.15) }
}
@media (prefers-reduced-motion: reduce) {
  .rvb * { animation: none !important; }
  .rvb-stray { opacity: 0; }
}
`

/** A small glass bubble: milky center, opal rim, one glint. */
function Bubble({ cx, cy, r, id }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-bubble)`} />
      <circle cx={cx} cy={cy} r={r - 0.5} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={Math.max(0.8, r / 7)} opacity=".75" />
      <ellipse cx={cx - r * 0.38} cy={cy - r * 0.42} rx={r * 0.28} ry={r * 0.16} transform={`rotate(-35 ${cx - r * 0.38} ${cy - r * 0.42})`} fill="#fff" opacity=".95" />
    </g>
  )
}

/** The bot alone. `size` is its width in px. */
export function ReviveBubbleBot({ size = 104, className = '', title = 'Revive AI' }) {
  const id = 'rvb' + useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <div className={`rvb relative inline-block ${className}`} style={{ width: size, height: size * 1.06 }} role="img" aria-label={title}>
      <style>{css}</style>

      {/* shadow: shrinks and fades as the bot rises */}
      <div
        aria-hidden="true"
        className="rvb-shadow absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: size * 0.04,
          width: size * 0.62,
          height: size * 0.09,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(97,0,158,.28), rgba(62,98,182,.12) 55%, transparent)',
          filter: 'blur(2px)',
        }}
      />

      <div className="rvb-float absolute inset-x-0 top-0" style={{ height: size }}>
        <svg viewBox="0 0 200 200" width={size} height={size} overflow="visible" aria-hidden="true">
          <defs>
            {/* milky glass body: royal blue and deep purple, very light, into pink and opal */}
            <linearGradient id={`${id}-body`} x1="0.1" y1="0" x2="0.9" y2="1">
              <stop offset="0" stopColor="#e9eeff" />
              <stop offset=".3" stopColor="#cdd6f6" />
              <stop offset=".58" stopColor="#ddd2f6" />
              <stop offset=".82" stopColor="#f3d5ef" />
              <stop offset="1" stopColor="#e6d9fb" />
            </linearGradient>
            <linearGradient id={`${id}-tint`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3E62B6" stopOpacity=".26" />
              <stop offset=".55" stopColor="#61009E" stopOpacity=".1" />
              <stop offset="1" stopColor="#ff8fd0" stopOpacity=".16" />
            </linearGradient>
            {/* the lit core, slightly low, like light gathering in a drop */}
            <radialGradient id={`${id}-core`} cx=".5" cy=".64" r=".52">
              <stop offset="0" stopColor="#fff" stopOpacity=".85" />
              <stop offset=".55" stopColor="#f6f3ff" stopOpacity=".45" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            {/* the opal rim; it slowly turns so the colors drift around the edge */}
            <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
              <stop offset="0" stopColor="#3E62B6" />
              <stop offset=".28" stopColor="#9b86ec" />
              <stop offset=".5" stopColor="#ffa6da" />
              <stop offset=".7" stopColor="#a6ecff" />
              <stop offset="1" stopColor="#61009E" />
              <animateTransform attributeName="gradientTransform" type="rotate" values="0 .5 .5;360 .5 .5" dur="18s" repeatCount="indefinite" />
            </linearGradient>
            <radialGradient id={`${id}-bubble`} cx=".42" cy=".38" r=".62">
              <stop offset="0" stopColor="#fff" stopOpacity=".55" />
              <stop offset=".6" stopColor="#dfe4ff" stopOpacity=".2" />
              <stop offset="1" stopColor="#a995ee" stopOpacity=".45" />
            </radialGradient>
            <linearGradient id={`${id}-eye`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6c7596" />
              <stop offset="1" stopColor="#8d96b4" />
            </linearGradient>
            <clipPath id={`${id}-clip`}>
              <path d={HOUSE} />
            </clipPath>
            <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.4" />
            </filter>
            <filter id={`${id}-haze`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          <g className="rvb-breathe">
            <g className="rvb-wobble">
              {/* body */}
              <path d={HOUSE} fill={`url(#${id}-body)`} opacity=".92" />
              <path d={HOUSE} fill={`url(#${id}-tint)`} />
              <path d={HOUSE} fill={`url(#${id}-core)`} />

              <g clipPath={`url(#${id}-clip)`}>
                {/* thick translucent inner rim, the glass wall seen edge-on */}
                <path d={HOUSE} fill="none" stroke="#7d6fdc" strokeOpacity=".2" strokeWidth="16" />
                <path d={HOUSE} fill="none" stroke={`url(#${id}-rim)`} strokeOpacity=".35" strokeWidth="9" filter={`url(#${id}-soft)`} />
                {/* the inner bubble wall, a faint second house inside */}
                <path d={HOUSE} fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" transform="translate(100 112) scale(.8) translate(-100 -112)" filter={`url(#${id}-soft)`} />
                {/* soft sheen across the upper left */}
                <ellipse className="rvb-sheen" cx="78" cy="92" rx="38" ry="20" transform="rotate(-32 78 92)" fill="#fff" opacity=".7" filter={`url(#${id}-haze)`} />
                {/* warm pink reflection low on the right */}
                <path d="M152 140C152 158 146 168 128 171" fill="none" stroke="#ffc2ea" strokeWidth="4" strokeLinecap="round" opacity=".75" filter={`url(#${id}-soft)`} />
              </g>

              {/* outer opal edge */}
              <path d={HOUSE} fill="none" stroke={`url(#${id}-rim)`} strokeWidth="2.2" strokeOpacity=".7" />

              {/* specular highlights, strongest on the top-left edges */}
              <g className="rvb-shimmer">
                <path d="M34 82L83 44.5C88 40.6 93 38.4 98 38" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" opacity=".95" filter={`url(#${id}-soft)`} />
                <path d="M48 112V150" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" opacity=".7" filter={`url(#${id}-soft)`} />
                <ellipse cx="57" cy="66" rx="7.5" ry="2.6" transform="rotate(-37 57 66)" fill="#fff" />
                <circle cx="44" cy="96" r="1.8" fill="#fff" opacity=".9" />
                <path d="M136 40.5C138 38.6 140.4 38 142.6 38.4" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity=".9" />
              </g>

              {/* face */}
              <g className="rvb-eyes">
                <rect x="78.5" y="103" width="10.5" height="22" rx="5.25" fill={`url(#${id}-eye)`} opacity=".9" />
                <rect x="111" y="103" width="10.5" height="22" rx="5.25" fill={`url(#${id}-eye)`} opacity=".9" />
                <rect x="80.5" y="105.5" width="3" height="6" rx="1.5" fill="#fff" opacity=".55" />
                <rect x="113" y="105.5" width="3" height="6" rx="1.5" fill="#fff" opacity=".55" />
              </g>
              <path d="M92.5 135.5Q100 141.5 107.5 135.5" fill="none" stroke="#7d86a6" strokeWidth="3" strokeLinecap="round" opacity=".75" />
            </g>
          </g>

          {/* the companion bubble, drifting on its own */}
          <g className="rvb-companion">
            <Bubble cx={170} cy={14} r={8.5} id={id} />
          </g>
          {/* stray breath bubbles leaving the chimney */}
          <g className="rvb-stray">
            <Bubble cx={147} cy={26} r={3.6} id={id} />
          </g>
          <g className="rvb-stray rvb-stray-2">
            <Bubble cx={156} cy={30} r={2.6} id={id} />
          </g>
        </svg>
      </div>
    </div>
  )
}

/** The bot in its place on the Revive AI page: centered above the greeting. */
export default function ReviveBubbleBotPreview() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center bg-white px-6 py-12 text-center" style={{ fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif" }}>
      <ReviveBubbleBot size={104} />
      <h2 className="mt-5 text-[28px] leading-9 font-semibold text-[#1b2b4b]">What can I help you with?</h2>
      <p className="mt-2 max-w-md text-[15px] leading-6 text-[#4a5568]">Generate a report, start a project, or ask about any home or anyone in your book.</p>
    </div>
  )
}
