// Temporarily disabled Sentry to fix dev server issues
// import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Sentry disabled
  console.log('Instrumentation registered (Sentry disabled)');
}

export const onRequestError = async (error: any) => {
  console.error('Request error:', error);
};
