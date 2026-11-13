const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  try {
    supabase = createClient(url, key, {
      auth: { persistSession: false },
    });
    return supabase;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
    return null;
  }
}

module.exports = { getSupabase };
