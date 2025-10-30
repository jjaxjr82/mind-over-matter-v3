// External Supabase client for shared database
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const EXTERNAL_SUPABASE_URL = 'https://kvnxbwefougjfaozrepm.supabase.co';
const EXTERNAL_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2bnhid2Vmb3VnamZhb3pyZXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Nzc1NTYsImV4cCI6MjA3NzI1MzU1Nn0.9ptHhkQUEFe68zafUd92Vh1yPnYKEpgEP4XYbeGMvaU';

export const externalClient = createClient<Database>(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
