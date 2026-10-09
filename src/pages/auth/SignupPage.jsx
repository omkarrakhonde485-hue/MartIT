import { Link } from 'react-router'
import { PhasePlaceholder } from '@/components/layout/PhasePlaceholder'

export default function SignupPage() {
  return (
    <PhasePlaceholder phase={3} title="Create your account">
      Sign-up creates a customer account. Runner access is assigned separately after approval.{' '}
      <Link to="/login" className="font-medium text-fresh-ink underline underline-offset-4">
        Try a sample account
      </Link>{' '}
      meanwhile.
    </PhasePlaceholder>
  )
}
