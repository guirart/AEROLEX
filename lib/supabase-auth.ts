export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wefovgbdapaanqqgqapp.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_3YTteOF_JIbTVbQcA6vEgQ_PZwBjoxW";

export const ACCESS_COOKIE = "aerolex_access_token";
export const REFRESH_COOKIE = "aerolex_refresh_token";

export const authHeaders = {
  apikey: SUPABASE_PUBLISHABLE_KEY,
  "Content-Type": "application/json",
};
