import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getProfiles, updateProfile } from "../lib/api/profiles";
import { FInput, FSelect } from "../components/ui";

// ─── Constantes ───────────────────────────────────────────────────────────────

const ROLES = [
  { value: "cip",       label: "CIP",       desc: "Conseiller Insertion Pro" },
  { value: "direction", label: "Direction",  desc: "Accès lecture totale"     },
  { value: "admin",     label: "Admin",      desc: "Accès complet"            },
];

const ROLE_STYLE = {
  admin:     "bg-purple-100 text-purple-700 border-purple-200",
  direction: "bg-blue-100   text-blue-700   border-blue-200",
  cip:       "bg-green-100  text-green-700  border-green-200",
};

const ROLE_LABEL = { admin: "Admin", direction: "Direction", cip: "CIP" };


// ─── Badge rôle ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ROLE_STYLE[role]}`}>
      {ROLE_LABEL[role]}
    </span>
  );
}

// ─── Carte utilisateur (avec édition inline) ──────────────────────────────────
function UserCard({ profile, sites, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({ role: profile.role, site_id: profile.site_id ?? "", actif: profile.actif });
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");

  const initials = `${profile.prenom?.[0] ?? ""}${profile.nom?.[0] ?? ""}`.toUpperCase();

  const save = async () => {
    setErr("");
    if (form.role === "cip" && !form.site_id) {
      return setErr("Un CIP doit avoir un site.");
    }
    setSaving(true);
    try {
      await updateProfile(profile.id, {
        role:    form.role,
        site_id: form.role === "cip" ? form.site_id : null,
        actif:   form.actif,
      });
      setEditing(false);
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const site = sites.find(s => s.id === profile.site_id);

  return (
    <div className={`bg-white rounded-xl border p-4 transition-all ${!profile.actif ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white ${
          profile.role === "admin" ? "bg-purple-500" :
          profile.role === "direction" ? "bg-blue-500" : "bg-green-500"
        }`}>
          {initials || "?"}
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">
              {profile.prenom} {profile.nom}
            </p>
            <RoleBadge role={profile.role} />
            {!profile.actif && (
              <span className="text-xs text-gray-400 italic">inactif</span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate">{profile.email}</p>
          {site && (
            <p className="text-xs text-gray-500 mt-0.5">
              {site.filiale && <span className="mr-1">{site.filiale} —</span>}
              {site.nom}
            </p>
          )}
        </div>

        {/* Bouton éditer */}
        <button
          onClick={() => { setEditing(!editing); setErr(""); }}
          className="text-xs text-indigo-600 hover:text-indigo-800 shrink-0"
        >
          {editing ? "Annuler" : "Modifier"}
        </button>
      </div>

      {/* Formulaire inline */}
      {editing && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <FSelect
            label="Rôle"
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          >
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
            ))}
          </FSelect>

          {form.role === "cip" && (
            <FSelect
              label="Site"
              value={form.site_id}
              onChange={e => setForm(f => ({ ...f, site_id: e.target.value }))}
            >
              <option value="">— Sélectionner un site —</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.nom}</option>
              ))}
            </FSelect>
          )}

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.actif}
              onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))}
              className="rounded border-gray-300 text-indigo-600"
            />
            <span className="text-xs text-gray-600">Compte actif</span>
          </label>

          {err && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}

          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Vue par rôle ─────────────────────────────────────────────────────────────
function ByRole({ profiles, sites, onRefresh }) {
  return (
    <div className="space-y-8">
      {ROLES.slice().reverse().map(({ value, label }) => {
        const group = profiles.filter(p => p.role === value);
        return (
          <section key={value}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</h3>
              <span className="text-xs text-gray-400">({group.length})</span>
            </div>
            {group.length === 0 ? (
              <p className="text-xs text-gray-400 italic pl-1">Aucun utilisateur</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.map(p => (
                  <UserCard key={p.id} profile={p} sites={sites} onSaved={onRefresh} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

// ─── Vue par filiale ──────────────────────────────────────────────────────────
function ByFiliale({ profiles, sites, onRefresh }) {
  // Grouper les sites par filiale
  const filialeMap = {};
  sites.forEach(s => {
    const key = s.filiale ?? s.nom;
    if (!filialeMap[key]) filialeMap[key] = { filiale: key, secteurs: {} };
    const sec = s.secteur ?? "—";
    if (!filialeMap[key].secteurs[sec]) filialeMap[key].secteurs[sec] = [];
    filialeMap[key].secteurs[sec].push(s);
  });

  // Admin / Direction = accès cross-site → groupe séparé
  const crossSite = profiles.filter(p => p.role !== "cip");

  return (
    <div className="space-y-10">
      {/* Utilisateurs sans site (admin / direction) */}
      {crossSite.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Accès multi-sites</h3>
            <span className="text-xs text-gray-400">(Admin + Direction)</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {crossSite.map(p => (
              <UserCard key={p.id} profile={p} sites={sites} onSaved={onRefresh} />
            ))}
          </div>
        </section>
      )}

      {/* Par filiale → secteur → site */}
      {Object.values(filialeMap).map(({ filiale, secteurs }) => (
        <section key={filiale}>
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
            Filiale — {filiale}
          </h3>

          {Object.entries(secteurs).map(([secteur, sitesList]) => {
            const siteIds = sitesList.map(s => s.id);
            const cipsSite = profiles.filter(p => p.role === "cip" && siteIds.includes(p.site_id));

            return (
              <div key={secteur} className="ml-4 mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Secteur — {secteur}
                </p>
                {sitesList.map(site => {
                  const cipsSite2 = profiles.filter(p => p.role === "cip" && p.site_id === site.id);
                  return (
                    <div key={site.id} className="ml-4 mb-4">
                      <p className="text-xs text-gray-500 mb-2 font-medium">{site.nom} ({site.ville})</p>
                      {cipsSite2.length === 0 ? (
                        <p className="text-xs text-gray-300 italic pl-1">Aucun CIP</p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {cipsSite2.map(p => (
                            <UserCard key={p.id} profile={p} sites={sites} onSaved={onRefresh} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}

// ─── Onglet Gestion utilisateurs ──────────────────────────────────────────────
function UserManagement({ sites }) {
  const [profiles,  setProfiles]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [viewMode,  setViewMode]  = useState("role"); // "role" | "filiale"
  const [search,    setSearch]    = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProfiles(await getProfiles());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase();
    return (
      p.nom.toLowerCase().includes(q)    ||
      p.prenom.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Barre d'outils */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="search"
          placeholder="Rechercher un utilisateur…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 w-64"
        />
        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-medium">
          {[["role", "Par rôle"], ["filiale", "Par filiale"]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-4 py-2 transition-colors ${
                viewMode === v ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">{filtered.length} utilisateur{filtered.length > 1 ? "s" : ""}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : viewMode === "role" ? (
        <ByRole profiles={filtered} sites={sites} onRefresh={load} />
      ) : (
        <ByFiliale profiles={filtered} sites={sites} onRefresh={load} />
      )}
    </div>
  );
}

// ─── Onglet Invitations ───────────────────────────────────────────────────────
function InviteForm({ sites }) {
  const [email,   setEmail]   = useState("");
  const [role,    setRole]    = useState("cip");
  const [siteId,  setSiteId]  = useState(sites[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState(null);

  const send = async () => {
    setMsg(null);
    if (!email.trim()) return setMsg({ type: "error", text: "L'email est obligatoire." });
    if (role === "cip" && !siteId) return setMsg({ type: "error", text: "Sélectionnez un site pour un CIP." });

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
            email:   email.trim(),
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

  const selectedSite = sites.find(s => s.id === siteId);

  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Envoyer une invitation</h2>

        <FInput
          label="Adresse email"
          required
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="prenom.nom@idees.fr"
        />

        <FSelect label="Rôle" required value={role} onChange={e => setRole(e.target.value)}>
          {ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
          ))}
        </FSelect>

        {role === "cip" && (
          <FSelect label="Site" required value={siteId} onChange={e => setSiteId(e.target.value)}>
            <option value="">— Sélectionner un site —</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.nom}</option>
            ))}
          </FSelect>
        )}

        {/* Récapitulatif */}
        {email && (
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
            <p><span className="font-medium">Email :</span> {email}</p>
            <p><span className="font-medium">Rôle :</span> <RoleBadge role={role} /></p>
            {role === "cip" && selectedSite && (
              <>
                <p><span className="font-medium">Filiale :</span> {selectedSite.filiale ?? "—"}</p>
                <p><span className="font-medium">Site :</span> {selectedSite.nom}</p>
                {selectedSite.secteur && (
                  <p><span className="font-medium">Secteur :</span> {selectedSite.secteur}</p>
                )}
              </>
            )}
          </div>
        )}

        {msg && (
          <p className={`text-sm rounded-lg px-3 py-2 ${
            msg.type === "success" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"
          }`}>
            {msg.text}
          </p>
        )}

        <button
          onClick={send}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {loading ? "Envoi en cours…" : "Envoyer l'invitation"}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Le rôle est verrouillé à l'envoi — l'invité ne peut pas le modifier.
        </p>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Admin({ user, sites }) {
  const [tab, setTab] = useState("invite");

  if (user.role !== "admin") {
    return <div className="p-8 text-red-600 text-sm">Accès refusé.</div>;
  }

  const tabs = [
    { id: "invite", label: "Inviter un utilisateur" },
    { id: "users",  label: "Gestion des utilisateurs" },
  ];

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Administration</h1>
        <p className="text-sm text-gray-400 mt-1">Gestion des accès et des utilisateurs.</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "invite" && <InviteForm sites={sites} />}
      {tab === "users"  && <UserManagement sites={sites} />}
    </div>
  );
}
