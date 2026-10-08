import { RenoVisionGallery } from '@/components/property/RenoVisionGallery'
import { PAGE } from '@/lib/utils'

// Marketing center. For now: the agent's RenoVision designs made from photos with no home attached.
// (Designs for a home live on that home's page, under Marketing.)
export default function Marketing() {
  return (
    <div className={PAGE}>
      <header className="border-b border-line pb-6">
        <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Marketing center</h1>
        <p className="mt-1 text-[15px] text-ink-2">Marketing materials branded for you. Templates, brand kit and guides are coming next.</p>
      </header>
      <div className="mt-8">
        <RenoVisionGallery propertyId={null} title="Your RenoVision designs" empty="Designs you make from photos without a home attached are saved here. Designs for a home are saved on that home’s page." />
      </div>
    </div>
  )
}
