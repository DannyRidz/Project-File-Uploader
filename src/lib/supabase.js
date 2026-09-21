import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not defined");
}

if (!supabaseSecretKey) {
  throw new Error("SUPABASE_SECRET_KEY is not defined");
}

if (!supabaseBucket) {
  throw new Error("SUPABASE_BUCKET is not defined");
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: WebSocket,
  },
});

export { supabase, supabaseBucket, supabaseUrl };
