// Edge Function : invite-user
// Envoie une invitation Supabase avec le rôle et le site pré-définis.
// Seul un admin peut appeler cette fonction.
//
// Déploiement :
//   supabase functions deploy invite-user --no-verify-jwt
// Variables d'env à ajouter dans Supabase Dashboard → Edge Functions :
//   SUPABASE_URL          (auto-injecté)
//   SUPABASE_SERVICE_ROLE_KEY (à ajouter manuellement dans les secrets)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Vérifier que l'appelant est authentifié et admin ──────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return Response.json({ error: "Non authentifié" }, { status: 401, headers: corsHeaders });
    }

    // Client avec la session de l'appelant (pour vérifier son rôle via RLS)
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: profile, error: profileErr } = await supabaseUser
      .from("profiles")
      .select("role")
      .eq("id", (await supabaseUser.auth.getUser()).data.user?.id)
      .single();

    if (profileErr || profile?.role !== "admin") {
      return Response.json(
        { error: "Accès refusé : seul un admin peut inviter des utilisateurs." },
        { status: 403, headers: corsHeaders }
      );
    }

    // ── 2. Lire le corps de la requête ───────────────────────────────────────
    const { email, role, site_id } = await req.json();

    if (!email || !role) {
      return Response.json({ error: "email et role sont obligatoires." }, { status: 400, headers: corsHeaders });
    }
    if (role === "cip" && !site_id) {
      return Response.json({ error: "site_id obligatoire pour le rôle CIP." }, { status: 400, headers: corsHeaders });
    }

    // ── 3. Envoyer l'invitation avec la service_role key ─────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${Deno.env.get("APP_URL") ?? "https://idees-suivi-parcours-oa5e.vercel.app"}`,
      data: {
        role,
        site_id: site_id ?? null,
      },
    });

    if (inviteErr) {
      return Response.json({ error: inviteErr.message }, { status: 400, headers: corsHeaders });
    }

    return Response.json({ success: true }, { headers: corsHeaders });

  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: corsHeaders });
  }
});
