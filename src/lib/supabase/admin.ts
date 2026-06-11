import "server-only";

import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client. BYPASSES Row-Level Security. Server-only —
// never import this into client code. Used solely by the CSV import endpoint
// to bulk-upsert contacts and connections.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
