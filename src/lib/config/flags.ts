// Feature flags for progressive rollout
'use client';

export function isLocationScopeEnabled(): boolean {
  // Env default: enabled unless explicitly set to 'false'
  const env = process.env.NEXT_PUBLIC_LOCATION_SCOPE_ENABLED;
  let enabled = env !== 'false';
  try {
    // Local override for quick rollback/testing (set to 'false' to disable)
    const local = typeof window !== 'undefined' ? localStorage.getItem('feature_location_scope_enabled') : null;
    if (local === 'false') enabled = false;
    if (local === 'true') enabled = true;
  } catch {}
  return enabled;
}

