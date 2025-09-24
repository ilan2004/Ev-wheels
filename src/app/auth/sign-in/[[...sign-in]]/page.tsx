import { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Authentication | Sign In',
  description: 'Sign In page for authentication.'
};

export default async function Page() {
  // This component is not used in the E-Wheels auth flow
  // We use custom auth pages at /sign-in and /sign-up
  return <SignInViewPage stars={0} />;
}
