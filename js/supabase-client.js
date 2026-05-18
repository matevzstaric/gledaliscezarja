/* =============================================================
   Supabase client — initialized for the public site & admin
   =============================================================
   Both URL and publishable key are safe to expose to the browser.
   Row Level Security (RLS) policies on the database enforce what
   anonymous visitors vs. authenticated admins can read/write.
   ============================================================= */

const SUPABASE_URL = 'https://ldlvwsgjjisfqangdcfw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_abwwAapNqwoE1zkDxIItfA_6igjWIb5';

// supabase.createClient comes from the SDK script loaded in the HTML
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
