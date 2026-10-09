import { ProblemSolution } from '@/components/marketing/ProblemSolution'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { FeatureBento } from '@/components/marketing/FeatureBento'
import { CategoriesPreview } from '@/components/marketing/CategoriesPreview'
import { TrustSection } from '@/components/marketing/TrustSection'
import { AboutLoop } from '@/components/marketing/AboutLoop'
import { Faq } from '@/components/marketing/Faq'
import { FinalCta } from '@/components/marketing/FinalCta'

/** Everything after the hero, split into its own chunk so first paint only needs the hero. */
export default function BelowTheFold() {
  return (
    <>
      <ProblemSolution />
      <HowItWorks />
      <FeatureBento />
      <CategoriesPreview />
      <TrustSection />
      <AboutLoop />
      <Faq />
      <FinalCta />
    </>
  )
}
