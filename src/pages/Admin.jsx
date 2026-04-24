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
  const [form,    setForm]    = useState({
    role:     profile.role,
    site_ids: profile.site_ids ?? (profile.site_id ? [profile.site_id] : []),
    actif:    profile.actif,
  });
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");

  const initials = `${profile.prenom?.[0] ?? ""}${profile.nom?.[0] ?? ""}`.toUpperCase();

  const save = async () => {
    setErr("");
    if (form.role !== "admin" && form.site_ids.length === 0) {
      return setErr("Sélectionnez au moins un site.");
    }
    setSaving(true);
    try {
      await updateProfile(profile.id, {
        role:     form.role,
        site_id:  form.role === "admin" ? null : (form.site_ids[0] ?? null),
        site_ids: form.role === "admin" ? [] : form.site_ids,
        actif:    form.actif,
      });
      setEditing(false);
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Sites affichés dans la carte (hors édition)
  const assignedSites = (profile.site_ids ?? []).map(id => sites.find(s => s.id === id)).filter(Boolean);

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
          {/* Sites assignés */}
          {assignedSites.length > 0 && (
            <div className="mt-0.5 space-y-0.5">
              {assignedSites.slice(0, 3).map(s => (
                <p key={s.id} className="text-xs text-gray-500">
                  {[s.filiale, s.nom].filter(Boolean).join(" › ")}
                </p>
              ))}
              {assignedSites.length > 3 && (
                <p className="text-xs text-gray-400 italic">+{assignedSites.length - 3} autre{assignedSites.length - 3 > 1 ? "s" : ""}</p>
              )}
            </div>
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
            onChange={e => setForm(f => ({ ...f, role: e.target.value, site_ids: e.target.value === "admin" ? [] : f.site_ids }))}
          >
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
            ))}
          </FSelect>

          {form.role !== "admin" && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Sites accessibles ({form.site_ids.length} sélectionné{form.site_ids.length > 1 ? "s" : ""})
              </p>
              <SiteMultiPicker
                sites={sites}
                value={form.site_ids}
                onChange={ids => setForm(f => ({ ...f, site_ids: ids }))}
              />
            </div>
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
  // Grouper : filiale → secteur → activite → sites[]
  const filialeMap = {};
  sites.forEach(s => {
    const fil = s.filiale ?? s.nom;
    const sec = s.secteur  ?? "—";
    const act = s.activite ?? "—";
    if (!filialeMap[fil]) filialeMap[fil] = {};
    if (!filialeMap[fil][sec]) filialeMap[fil][sec] = {};
    if (!filialeMap[fil][sec][act]) filialeMap[fil][sec][act] = [];
    filialeMap[fil][sec][act].push(s);
  });

  // Admin = accès global, Direction/CIP multi-sites = apparaissent dans chaque filiale concernée
  const adminProfiles = profiles.filter(p => p.role === "admin");

  return (
    <div className="space-y-10">
      {/* Admins (accès global) */}
      {adminProfiles.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Administrateurs</h3>
            <span className="text-xs text-gray-400">(accès global)</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {adminProfiles.map(p => <UserCard key={p.id} profile={p} sites={sites} onSaved={onRefresh} />)}
          </div>
        </section>
      )}

      {/* Filiale → Secteur → Activité → Site */}
      {Object.entries(filialeMap).map(([filiale, secteurs]) => (
        <section key={filiale}>
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
            Filiale — {filiale}
          </h3>

          {Object.entries(secteurs).map(([secteur, activites]) => (
            <div key={secteur} className="ml-4 mb-6">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-2">
                Secteur — {secteur}
              </p>

              {Object.entries(activites).map(([activite, sitesList]) => (
                <div key={activite} className="ml-4 mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Activité — {activite}
                  </p>

                  {sitesList.map(site => {
                    // Utilisateurs ayant ce site dans leur site_ids (Direction + CIP)
                    const assigned = profiles.filter(p =>
                      p.role !== "admin" && (p.site_ids ?? []).includes(site.id)
                    );
                    return (
                      <div key={site.id} className="ml-4 mb-3">
                        <p className="text-xs text-gray-500 font-medium mb-2">
                          Site — {site.nom}{site.ville ? ` (${site.ville})` : ""}
                        </p>
                        {assigned.length === 0 ? (
                          <p className="text-xs text-gray-300 italic pl-1">Aucun utilisateur affecté</p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {assigned.map(p => <UserCard key={p.id} profile={p} sites={sites} onSaved={onRefresh} />)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
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

// ─── Sélecteur hiérarchique multi-sites (filiale → secteur → activité → ✓ sites)
function SiteMultiPicker({ sites, value = [], onChange }) {
  const [filiale,  setFiliale]  = useState("");
  const [secteur,  setSecteur]  = useState("");
  const [activite, setActivite] = useState("");

  const filialesList  = [...new Set(sites.map(s => s.filiale).filter(Boolean))];
  const secteursList  = [...new Set(
    sites.filter(s => !filiale || s.filiale === filiale).map(s => s.secteur).filter(Boolean)
  )];
  const activitesList = [...new Set(
    sites.filter(s => (!filiale || s.filiale === filiale) && (!secteur || s.secteur === secteur))
      .map(s => s.activite).filter(Boolean)
  )];
  const sitesFiltres = sites.filter(s =>
    (!filiale  || s.filiale  === filiale)  &&
    (!secteur  || s.secteur  === secteur)  &&
    (!activite || s.activite === activite)
  );

  const toggle = siteId => onChange(
    value.includes(siteId) ? value.filter(id => id !== siteId) : [...value, siteId]
  );

  // Cocher/décocher tous les sites filtrés d'un coup
  const toggleAll = () => {
    const ids = sitesFiltres.map(s => s.id);
    const allChecked = ids.every(id => value.includes(id));
    if (allChecked) onChange(value.filter(id => !ids.includes(id)));
    else onChange([...new Set([...value, ...ids])]);
  };

  const NavChip = ({ label, active, onClick }) => (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
        active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
      }`}
    >{label}</button>
  );

  const selectedSites = sites.filter(s => value.includes(s.id));

  return (
    <div className="space-y-3">

      {/* ── Tags sites sélectionnés ── */}
      {selectedSites.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Sélectionnés ({selectedSites.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedSites.map(s => (
              <span key={s.id}
                className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded-full border border-indigo-200">
                {[s.filiale, s.nom].filter(Boolean).join(" › ")}
                <button type="button" onClick={() => toggle(s.id)}
                  className="ml-0.5 text-indigo-400 hover:text-red-500 leading-none">×</button>
              </span>
            ))}
            <button type="button" onClick={() => onChange([])}
              className="text-xs text-red-400 hover:text-red-600 px-1">
              Tout effacer
            </button>
          </div>
        </div>
      )}

      {/* ── Navigation : Filiale ── */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Filiale</p>
        <div className="flex flex-wrap gap-2">
          <NavChip label="Toutes" active={!filiale} onClick={() => { setFiliale(""); setSecteur(""); setActivite(""); }} />
          {filialesList.map(f => <NavChip key={f} label={f} active={filiale === f} onClick={() => { setFiliale(f); setSecteur(""); setActivite(""); }} />)}
        </div>
      </div>

      {/* ── Navigation : Secteur ── */}
      {secteursList.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Secteur</p>
          <div className="flex flex-wrap gap-2">
            <NavChip label="Tous" active={!secteur} onClick={() => { setSecteur(""); setActivite(""); }} />
            {secteursList.map(s => <NavChip key={s} label={s} active={secteur === s} onClick={() => { setSecteur(s); setActivite(""); }} />)}
          </div>
        </div>
      )}

      {/* ── Navigation : Activité ── */}
      {activitesList.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Activité</p>
          <div className="flex flex-wrap gap-2">
            <NavChip label="Toutes" active={!activite} onClick={() => setActivite("")} />
            {activitesList.map(a => <NavChip key={a} label={a} active={activite === a} onClick={() => setActivite(a)} />)}
          </div>
        </div>
      )}

      {/* ── Checkboxes sites ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Sites ({sitesFiltres.length})
          </p>
          {sitesFiltres.length > 1 && (
            <button type="button" onClick={toggleAll}
              className="text-xs text-indigo-500 hover:text-indigo-700">
              {sitesFiltres.every(s => value.includes(s.id)) ? "Tout décocher" : "Tout cocher"}
            </button>
          )}
        </div>
        {sitesFiltres.length === 0
          ? <p className="text-xs text-gray-400 italic">Aucun site correspondant</p>
          : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {sitesFiltres.map(s => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={value.includes(s.id)}
                    onChange={() => toggle(s.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-gray-700 group-hover:text-indigo-700">
                    {s.nom}{s.ville ? ` — ${s.ville}` : ""}
                  </span>
                </label>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}

// ─── Onglet Invitations ───────────────────────────────────────────────────────
function InviteForm({ sites }) {
  const [email,    setEmail]    = useState("");
  const [role,     setRole]     = useState("cip");
  const [siteIds,  setSiteIds]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState(null);

  const needsSites = role === "cip" || role === "direction";

  const send = async () => {
    setMsg(null);
    if (!email.trim()) return setMsg({ type: "error", text: "L'email est obligatoire." });
    if (needsSites && siteIds.length === 0) return setMsg({ type: "error", text: "Sélectionnez au moins un site." });

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
            email:    email.trim(),
            role,
            site_id:  needsSites ? (siteIds[0] ?? null) : null,
            site_ids: needsSites ? siteIds : [],
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur serveur");
      setMsg({ type: "success", text: `Invitation envoyée à ${email.trim()}.` });
      setEmail("");
      setSiteIds([]);
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const selectedSites = sites.filter(s => siteIds.includes(s.id));

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700">Envoyer une invitation</h2>

        <FInput label="Adresse email" required type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="prenom.nom@idees.fr"
        />

        <FSelect label="Rôle" required value={role} onChange={e => { setRole(e.target.value); setSiteIds([]); }}>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
        </FSelect>

        {/* Sélection multi-sites pour CIP et Direction */}
        {needsSites && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Sites accessibles — {role === "cip" ? "CIP" : "Direction"} ({siteIds.length} sélectionné{siteIds.length > 1 ? "s" : ""})
            </p>
            <SiteMultiPicker sites={sites} value={siteIds} onChange={setSiteIds} />
          </div>
        )}

        {/* Récapitulatif */}
        {email && (!needsSites || siteIds.length > 0) && (
          <div className="bg-indigo-50 rounded-xl p-3 text-xs text-indigo-800 space-y-1 border border-indigo-100">
            <p className="font-semibold mb-1">Récapitulatif de l'invitation</p>
            <p><span className="font-medium">Email :</span> {email}</p>
            <p><span className="font-medium">Rôle :</span> <RoleBadge role={role} /></p>
            {selectedSites.length > 0 && (
              <div className="mt-1">
                <span className="font-medium">Sites ({selectedSites.length}) :</span>
                <ul className="mt-0.5 space-y-0.5 pl-2">
                  {selectedSites.map(s => (
                    <li key={s.id}>{[s.filiale, s.secteur !== s.activite ? s.activite : null, s.nom].filter(Boolean).join(" › ")}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {msg && (
          <p className={`text-sm rounded-lg px-3 py-2 ${msg.type === "success" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>
            {msg.text}
          </p>
        )}

        <button onClick={send} disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {loading ? "Envoi en cours…" : "Envoyer l'invitation"}
        </button>
        <p className="text-xs text-gray-400 text-center">Le rôle est verrouillé à l'envoi — l'invité ne peut pas le modifier.</p>
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
