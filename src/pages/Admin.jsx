import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getProfiles, updateProfile } from "../lib/api/profiles";
import { getHeuresMensuelles, upsertHeuresMensuelles } from "../lib/api/heures";
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
        `/api/invite-user`,
        {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${session.access_token}`,
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

// ─── Heures mensuelles (ETPI / ETPP) ─────────────────────────────────────────
const MOIS_LABELS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function KpiEtp({ label, heures, color }) {
  const etp = heures / 1820;
  return (
    <div className={`rounded-xl border p-4 text-center ${color === "indigo" ? "bg-indigo-50 border-indigo-200" : "bg-emerald-50 border-emerald-200"}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color === "indigo" ? "text-indigo-700" : "text-emerald-700"}`}>{etp.toFixed(2)}</p>
      <p className="text-xs text-gray-400 mt-0.5">{heures.toFixed(0)} h / 1820</p>
    </div>
  );
}

function HeuresMensuelles({ sites }) {
  const anneeActuelle = new Date().getFullYear();
  const [annee,    setAnnee]   = useState(anneeActuelle);
  const [mois,     setMois]    = useState(new Date().getMonth() + 1); // 1–12
  const [rows,     setRows]    = useState([]);   // données DB pour l'année
  const [edits,    setEdits]   = useState({});   // modifications locales en cours
  const [saving,   setSaving]  = useState({});
  const [loading,  setLoading] = useState(true);
  const [err,      setErr]     = useState("");
  // ── Filtres ──
  const [fFiliale,  setFFiliale]  = useState("");
  const [fSecteur,  setFSecteur]  = useState("");
  const [fActivite, setFActivite] = useState("");
  const [fSite,     setFSite]     = useState("");

  const allActive = sites.filter(s => s.actif !== false);

  // Listes de valeurs disponibles (pour les filtres)
  const filialesList  = [...new Set(allActive.map(s => s.filiale).filter(Boolean))];
  const secteursList  = [...new Set(
    allActive.filter(s => !fFiliale  || s.filiale  === fFiliale)
             .map(s => s.secteur).filter(Boolean)
  )];
  const activitesList = [...new Set(
    allActive.filter(s => (!fFiliale || s.filiale === fFiliale) && (!fSecteur || s.secteur === fSecteur))
             .map(s => s.activite).filter(Boolean)
  )];

  const sitesList = [...new Set(
    allActive.filter(s =>
      (!fFiliale  || s.filiale  === fFiliale)  &&
      (!fSecteur  || s.secteur  === fSecteur)  &&
      (!fActivite || s.activite === fActivite)
    ).map(s => s.nom).filter(Boolean)
  )];

  // Sites filtrés pour le tableau
  const activeSites = allActive.filter(s =>
    (!fFiliale  || s.filiale  === fFiliale)  &&
    (!fSecteur  || s.secteur  === fSecteur)  &&
    (!fActivite || s.activite === fActivite) &&
    (!fSite     || s.nom      === fSite)
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      setRows(await getHeuresMensuelles(annee));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [annee]);

  useEffect(() => { load(); setEdits({}); }, [load]);

  // Récupère la valeur DB pour un site+mois
  const getDbRow = (siteId, m) =>
    rows.find(r => r.site_id === siteId && r.mois === m) ?? null;

  // Clé unique pour les éditions locales
  const eKey = (siteId, m) => `${siteId}_${m}`;

  // Valeurs affichées : édition locale > DB > 0
  const getVal = (siteId, m) => {
    const k = eKey(siteId, m);
    if (edits[k]) return edits[k];
    const r = getDbRow(siteId, m);
    return {
      nb_salaries_insertion: r?.nb_salaries_insertion ?? 0,
      heures_insertion:      r?.heures_insertion      ?? 0,
      nb_permanents:         r?.nb_permanents         ?? 0,
      heures_permanents:     r?.heures_permanents     ?? 0,
    };
  };

  const setVal = (siteId, m, field, raw) => {
    const k = eKey(siteId, m);
    setEdits(prev => ({
      ...prev,
      [k]: { ...getVal(siteId, m), [field]: parseFloat(raw) || 0 },
    }));
  };

  const isDirty = (siteId, m) => !!edits[eKey(siteId, m)];

  const save = async (siteId, m) => {
    const k = eKey(siteId, m);
    if (!edits[k]) return;
    setSaving(p => ({ ...p, [k]: true }));
    setErr("");
    try {
      await upsertHeuresMensuelles({ site_id: siteId, annee, mois: m, ...edits[k] });
      await load();
      setEdits(p => { const n = { ...p }; delete n[k]; return n; });
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(p => ({ ...p, [k]: false }));
    }
  };

  // ── Totaux annuels (filtrés sur les sites affichés) ──
  const filteredSiteIds = new Set(activeSites.map(s => s.id));
  const filteredRows = rows.filter(r => filteredSiteIds.has(r.site_id));
  const totalHI = filteredRows.reduce((s, r) => s + (r.heures_insertion   || 0), 0);
  const totalHP = filteredRows.reduce((s, r) => s + (r.heures_permanents  || 0), 0);

  // Totaux du mois affiché
  const moisRows  = activeSites.map(s => getVal(s.id, mois));
  const moisHI    = moisRows.reduce((s, r) => s + (r.heures_insertion   || 0), 0);
  const moisHP    = moisRows.reduce((s, r) => s + (r.heures_permanents  || 0), 0);

  // Champs de saisie par site
  const NumCell = ({ siteId, m, field, placeholder }) => {
    const v = getVal(siteId, m)[field];
    return (
      <input
        type="number" min="0" step="0.5"
        value={v || ""}
        placeholder={placeholder}
        onChange={e => setVal(siteId, m, field, e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Sélecteur année ── */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden">
          <button onClick={() => setAnnee(a => a - 1)}
            className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-sm font-bold">◀</button>
          <span className="px-4 py-2 text-sm font-bold text-gray-900">{annee}</span>
          <button onClick={() => setAnnee(a => a + 1)}
            className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-sm font-bold">▶</button>
        </div>
        <p className="text-xs text-gray-400">Saisissez les heures par mois et par site. ETPI = heures insertion / 1820 · ETPP = heures permanents / 1820.</p>
      </div>

      {/* ── Filtres filiale / secteur / activité ── */}
      {(filialesList.length > 1 || secteursList.length > 0 || activitesList.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Filtrer l'affichage</p>
          <div className="flex gap-3 flex-wrap items-end">
            {filialesList.length > 1 && (
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1">Filiale</label>
                <select
                  value={fFiliale}
                  onChange={e => { setFFiliale(e.target.value); setFSecteur(""); setFActivite(""); }}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Toutes</option>
                  {filialesList.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            )}
            {secteursList.length > 0 && (
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1">Secteur</label>
                <select
                  value={fSecteur}
                  onChange={e => { setFSecteur(e.target.value); setFActivite(""); }}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Tous</option>
                  {secteursList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            {activitesList.length > 0 && (
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1">Activité</label>
                <select
                  value={fActivite}
                  onChange={e => setFActivite(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Toutes</option>
                  {activitesList.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            )}
            {sitesList.length > 1 && (
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1">Site</label>
                <select
                  value={fSite}
                  onChange={e => setFSite(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Tous</option>
                  {sitesList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            {(fFiliale || fSecteur || fActivite || fSite) && (
              <button
                onClick={() => { setFFiliale(""); setFSecteur(""); setFActivite(""); setFSite(""); }}
                className="text-xs text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
              >
                ✕ Effacer les filtres
              </button>
            )}
          </div>
          {activeSites.length < allActive.length && (
            <p className="text-xs text-indigo-600">
              {activeSites.length} site{activeSites.length > 1 ? "s" : ""} affiché{activeSites.length > 1 ? "s" : ""} sur {allActive.length}
            </p>
          )}
        </div>
      )}

      {/* ── KPI annuels ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-white border-gray-200 p-4 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Heures insertion</p>
          <p className="text-2xl font-bold text-gray-800">{totalHI.toFixed(0)} h</p>
          <p className="text-xs text-gray-400 mt-0.5">annuel</p>
        </div>
        <KpiEtp label="ETPI annuel" heures={totalHI} color="indigo" />
        <div className="rounded-xl border bg-white border-gray-200 p-4 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Heures permanents</p>
          <p className="text-2xl font-bold text-gray-800">{totalHP.toFixed(0)} h</p>
          <p className="text-xs text-gray-400 mt-0.5">annuel</p>
        </div>
        <KpiEtp label="ETPP annuel" heures={totalHP} color="emerald" />
      </div>

      {/* ── Onglets mois ── */}
      <div className="flex gap-1 flex-wrap border-b border-gray-200 pb-0">
        {MOIS_LABELS.map((l, i) => {
          const m = i + 1;
          const hasData = activeSites.some(s => filteredSiteIds.has(s.id) && getDbRow(s.id, m));
          return (
            <button key={m} onClick={() => setMois(m)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors relative ${
                mois === m
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {l}
              {hasData && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-400" />}
            </button>
          );
        })}
      </div>

      {/* ── Tableau du mois sélectionné ── */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {MOIS_LABELS[mois - 1]} {annee}
            </p>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Insertion : <strong className="text-indigo-700">{moisHI.toFixed(0)} h</strong></span>
              <span>Permanents : <strong className="text-emerald-700">{moisHP.toFixed(0)} h</strong></span>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Site</th>
                <th className="text-right p-3 text-xs font-semibold text-indigo-500 uppercase">Nb sal. insertion</th>
                <th className="text-right p-3 text-xs font-semibold text-indigo-500 uppercase">Heures insertion</th>
                <th className="text-right p-3 text-xs font-semibold text-emerald-600 uppercase">Nb permanents</th>
                <th className="text-right p-3 text-xs font-semibold text-emerald-600 uppercase">Heures perm.</th>
                <th className="p-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {activeSites.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-300 text-sm">Aucun site actif</td></tr>
              )}
              {activeSites.map(site => {
                const k = eKey(site.id, mois);
                const dirty = isDirty(site.id, mois);
                const isSaving = saving[k];
                return (
                  <tr key={site.id} className={`border-b border-gray-50 ${dirty ? "bg-amber-50" : ""}`}>
                    <td className="p-3">
                      <p className="font-medium text-gray-800 text-xs">{site.nom}</p>
                      {site.filiale && <p className="text-gray-400 text-xs">{site.filiale}</p>}
                    </td>
                    <td className="p-2">
                      <NumCell siteId={site.id} m={mois} field="nb_salaries_insertion" placeholder="0" />
                    </td>
                    <td className="p-2">
                      <NumCell siteId={site.id} m={mois} field="heures_insertion" placeholder="0.0" />
                    </td>
                    <td className="p-2">
                      <NumCell siteId={site.id} m={mois} field="nb_permanents" placeholder="0" />
                    </td>
                    <td className="p-2">
                      <NumCell siteId={site.id} m={mois} field="heures_permanents" placeholder="0.0" />
                    </td>
                    <td className="p-2 text-right">
                      <button
                        onClick={() => save(site.id, mois)}
                        disabled={!dirty || isSaving}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white disabled:opacity-30 hover:bg-indigo-700 transition-colors"
                      >
                        {isSaving ? "…" : "Enreg."}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Admin({ user, sites }) {
  const isDirection = user.role === "direction";
  const [tab, setTab] = useState(isDirection ? "heures" : "invite");

  if (user.role !== "admin" && user.role !== "direction") {
    return <div className="p-8 text-red-600 text-sm">Accès refusé.</div>;
  }

  const tabs = [
    ...(!isDirection ? [
      { id: "invite", label: "Inviter un utilisateur" },
      { id: "users",  label: "Gestion des utilisateurs" },
    ] : []),
    { id: "heures", label: "Heures insertion (ETPI/ETPP)" },
  ];

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {isDirection ? "Heures insertion (ETPI / ETPP)" : "Administration"}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {isDirection ? "Suivi des heures par site, filiale et activité." : "Gestion des accès et des utilisateurs."}
        </p>
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
      {tab === "heures" && <HeuresMensuelles sites={sites} />}
    </div>
  );
}
