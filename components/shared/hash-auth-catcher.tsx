'use client';

import { useEffect } from 'react';

/**
 * Tangkap Supabase implicit-flow hash (#access_token=...) yang nyasar ke
 * Site URL alih-alih redirect URL portal. Forward ke callback route yang
 * meng-handle setSession via supabase-js.
 *
 * Idempoten — kalau bukan halaman dengan hash auth, no-op.
 */
export function HashAuthCatcher() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token=')) return;
    // Sudah di callback path? hindari loop.
    if (window.location.pathname === '/portal/auth/callback') return;
    window.location.replace('/portal/auth/callback' + hash);
  }, []);
  return null;
}
