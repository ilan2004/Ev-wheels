import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'Authentication | Sign Up',
  description: 'Sign Up page for authentication.'
};

export default async function Page() {
  // This component is not used in the E-Wheels auth flow
  // We use custom auth pages at /sign-in and /sign-up
  return <SignUpViewPage stars={0} />;
}
