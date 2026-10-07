// Little line-drawn houses for the sample listings, in the same ink-on-pastel style as the
// homeowner avatars, so the example reads as illustration rather than real homes.

const INK = '#1f1f24'
const BG = ['#f0f3fa', '#efe6f7', '#effefa', '#fff4e5', '#f0f3fa', '#efe6f7']

function Window({ x, y, w = 8, h = 8 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="1" fill="#fff" />
      <path d={`M${x + w / 2} ${y}V${y + h}M${x} ${y + h / 2}H${x + w}`} />
    </g>
  )
}

function Tree({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x} 52V44`} />
      <circle cx={x} cy={38} r="7" fill="#fff" />
      <path d={`M${x - 3} 37q3 -3 6 0`} strokeWidth="1.5" />
    </g>
  )
}

const HOUSES = [
  // gable cottage with chimney and a tree
  <g key="0">
    <path d="M44 22v-6h5v10" fill="#fff" />
    <path d="M14 30 32 15l18 15" fill="#fff" />
    <rect x="17" y="29" width="30" height="23" fill="#fff" />
    <rect x="29" y="38" width="7" height="14" rx="1" fill="#fff" />
    <Window x={20} y={34} />
    <Window x={39} y={34} w={6} />
    <Tree x={54} />
  </g>,
  // two-storey with a flat porch
  <g key="1">
    <path d="M16 24 32 13l16 11" fill="#fff" />
    <rect x="18" y="23" width="28" height="29" fill="#fff" />
    <Window x={21} y={27} />
    <Window x={35} y={27} />
    <path d="M14 39h36" />
    <rect x="28" y="41" width="8" height="11" rx="1" fill="#fff" />
    <Window x={20} y={42} w={6} h={7} />
    <Window x={38} y={42} w={6} h={7} />
  </g>,
  // modern flat roof with a big window
  <g key="2">
    <path d="M12 27h40" />
    <rect x="15" y="27" width="34" height="25" fill="#fff" />
    <rect x="18" y="31" width="16" height="11" rx="1" fill="#fff" />
    <path d="M26 31v11" />
    <rect x="38" y="36" width="8" height="16" rx="1" fill="#fff" />
    <circle cx="44" cy="44" r="0.8" fill={INK} />
    <path d="M10 52c3-4 6-4 9 0" fill="#fff" />
  </g>,
  // A-frame with round window
  <g key="3">
    <path d="M12 52 32 14l20 38Z" fill="#fff" />
    <circle cx="32" cy="30" r="4" fill="#fff" />
    <path d="M32 26v8M28 30h8" strokeWidth="1.5" />
    <rect x="28" y="41" width="8" height="11" rx="1" fill="#fff" />
    <Tree x={9} />
  </g>,
  // bungalow with garage
  <g key="4">
    <path d="M8 33 22 22l14 11" fill="#fff" />
    <rect x="11" y="32" width="22" height="20" fill="#fff" />
    <rect x="19" y="40" width="6" height="12" rx="1" fill="#fff" />
    <Window x={13} y={36} w={5} h={6} />
    <Window x={27} y={36} w={5} h={6} />
    <path d="M33 34h21v18H33" fill="#fff" />
    <rect x="37" y="39" width="13" height="13" fill="#fff" />
    <path d="M37 43h13M37 47h13" strokeWidth="1.5" />
  </g>,
  // townhouse pair
  <g key="5">
    <path d="M12 24h20v28H12zM32 20h20v32H32z" fill="#fff" />
    <path d="M10 24h24M30 20h24" />
    <Window x={15} y={28} w={6} h={7} />
    <Window x={23} y={28} w={6} h={7} />
    <Window x={35} y={25} w={6} h={7} />
    <Window x={43} y={25} w={6} h={7} />
    <rect x="18" y="41" width="7" height="11" rx="1" fill="#fff" />
    <rect x="39" y="41" width="7" height="11" rx="1" fill="#fff" />
  </g>,
]

export function HouseIllo({ variant, className }: { variant: number; className?: string }) {
  const v = variant % HOUSES.length
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="12" fill={BG[v]} />
      <g fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 52h52" />
        {HOUSES[v]}
      </g>
    </svg>
  )
}
