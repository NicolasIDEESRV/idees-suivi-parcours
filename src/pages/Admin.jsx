import { useState } from "react";
import { supabase } from "../lib/supabase";
import { FInput, FSelect } from "../components/ui";

const ROLES = [
  { value: "cip",       label: "CIP — Conseiller Insertion Professionnelle" },
  { value: "direction", label: "Direction" },
  { value: "admin",     label: "Administrateur" },
];

function InviteForm({ sites }) {
  const [email,   setEmail]   = useState("");
  const [role,    setRole]    = useState("cip");
  const [siteId,  setSiteId]  = useState(sites[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState(null); // { type: "success"|"error", text }

  const send = async () => {
    setMsg(null);
    if (!email.trim()) return setMsg({ type: "error", text: "L'email est obligatoire." });
    if (role === "cip" && !siteId) return setMsg({ type: "error", text: "Sélectionnez un site pour ce rôle CIP." });

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
        {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey":        import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            email: email.trim(),
            role,
            site_id: role === "cip" ? siteId : null,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur serveur");
      setMsg({ type: "success", text: `Invitation envoyée à ${email.trim()}.` });
      setEmail("");
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Inviter un utilisateur</h2>
      <div className="space-y-4">
        <FInput
          label="Adresse email"
          required
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="prenom.nom@idees.fr"
        />
        <FSelect
          label="Rôle"
          required
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          {ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </FSelect>

        {role === "cip" && (
          <FSelect
            label="Site"
            required
            value={siteId}
            onChange={e => setSiteId(e.target.value)}
          >
            <option value="">— Sélectionner un site —</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.nom}</option>
            ))}
          </FSelect>
        )}

        {msg && (
          <p className={`text-sm rounded-lg px-3 py-2 ${
            msg.type === "success"
              ? "text-green-700 bg-green-50"
              : "text-red-600 bg-red-50"
          }`}>
            {msg.text}
          </p>
        )}

        <button
          onClick={send}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {loading ? "Envoi…" : "Envoyer l'invitation"}
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Le rôle est attribué définitivement à l'invitation.
        L'invité ne peut pas le modifier lui-même.
      </p>
    </div>
  );
}

export default function Admin({ user, sites }) {
  // Sécurité côté React (doublée par le RLS + Edge Function côté DB)
  if (user.role !== "admin") {
    return (
      <div className="p-8">
        <p className="text-red-600">Accès refusé.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Administration</h1>
        <p className="text-sm text-gray-400 mt-1">Gestion des utilisateurs et de la configuration.</p>
      </div>
      <InviteForm sites={sites} />
    </div>
  );
}
