const SUPABASE_URL = "https://hztsrizghlpzvsmvdfna.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6dHNyaXpnaGxwenZzbXZkZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0ODc5MTIsImV4cCI6MjEwNzA2MzkxMn0.8RkwcI4XLivE06tVm5rbN_ZdA3a7YJtm5qbq4Ej2nhg";

if (!window.supabase || typeof window.supabase.createClient !== "function") {
  throw new Error("Supabase SDK failed to load. Check your network connection.");
}

window.AshlySupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
