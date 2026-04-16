import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    "Variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY manquantes dans .env.local"
  );
}

// ⚠ Capturer le type de callback AVANT que createClient ne traite et efface le hash/code
// Supabase JS efface window.location.hash dès qu'il échange le token (flux implicite)
// ou le ?code= (flux PKCE). Cette constante est donc lue en tout premier.
export const AUTH_CALLBACK_TYPE = (() => {
  const hash   = window.location.hash;
  const params = new URLSearchParams(window.location.search);
  if (hash.includes("type=invite")   || params.get("type") === "invite")   return "invite";
  if (hash.includes("type=recovery") || params.get("type") === "recovery") return "recovery";
  if (hash.includes("type=signup")   || params.get("type") === "signup")   return "invite";
  // PKCE : ?code= seul = callback d'invitation ou de recovery
  if (params.has("code")) return "invite";
  return null;
})();

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
