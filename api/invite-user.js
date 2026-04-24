// Vercel Serverless Function — invite-user
// Appelée depuis Admin.jsx pour envoyer une invitation Supabase.
// Utilise la SERVICE_ROLE_KEY stockée dans les variables d'environnement Vercel
// (Settings → Environment Variables dans le dashboard Vercel).

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type, apikey");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // ── 1. Vérifier que l'appelant est authentifié et admin ──────────────────
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Non authentifié" });

    const supabaseUser = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return res.status(401).json({ error: "Session invalide" });

    const { data: profile } = await supabaseUser
      .from("profiles").select("role").eq("id", user.id).single();

    if (profile?.role !== "admin") {
      return res.status(403).json({ error: "Accès refusé : seul un admin peut inviter." });
    }

    // ── 2. Lire le corps ─────────────────────────────────────────────────────
    const { email, role, site_id, site_ids } = req.body;
    if (!email || !role) return res.status(400).json({ error: "email et role obligatoires." });

    const needsSites = role === "cip" || role === "direction";
    const resolvedSiteIds = Array.isArray(site_ids) && site_ids.length > 0
      ? site_ids : (site_id ? [site_id] : []);

    if (needsSites && resolvedSiteIds.length === 0) {
      return res.status(400).json({ error: "Au moins un site requis pour ce rôle." });
    }

    // ── 3. Envoyer l'invitation avec la clé admin ────────────────────────────
    // Accepte la clé en majuscules OU minuscules selon ce qui est configuré dans Vercel
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                    || process.env.supabase_service_role_key;
    if (!serviceKey) {
      return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY manquante dans les variables d'environnement Vercel." });
    }

    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const appUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://idees-suivi-parcours-oa5e.vercel.app";

    const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: appUrl,
      data: {
        role,
        site_id:  resolvedSiteIds[0] ?? null,
        site_ids: resolvedSiteIds,
      },
    });

    if (inviteErr) return res.status(400).json({ error: inviteErr.message });

    return res.status(200).json({ success: true });

  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
