import { PhasePlaceholder } from '@/components/layout/PhasePlaceholder'
import { useAuthStore } from '@/stores/authStore'

export default function HomePage() {
  const name = useAuthStore((s) => s.user?.name?.split(' ')[0])
  return <PhasePlaceholder phase={4} title={`Hi ${name ?? 'there'}`}>Search, categories and the catalogue land here in Phase 4.</PhasePlaceholder>
}
