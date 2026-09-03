import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oxbgzsmswbjijvxikupo.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey || 'sb_publishable_06bgVNYUOoIMBaxWQDQBaw_ckpUeg4f'
);
