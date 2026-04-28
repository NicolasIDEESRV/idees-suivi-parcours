import { useState } from "react";
import { todayStr } from "../lib/utils";
import { FInput, FTextarea } from "./ui";

// ─── Options impression / orientation ────────────────────────────────────────
const IMPRESSIONS = [
  { v: "tres_bien", l: "Très bien",  bg: "bg-green-100 text-green-800 border-green-300",  dot: "bg-green-500" },
  { v: "bien",      l: "Bien",       bg: "bg-blue-100  text-blue-800  border-blue-300",   dot: "bg-blue-500"  },
  { v: "doute",     l: "Doute",      bg: "bg-orange-100 text-orange-800 border-orange-300", dot: "bg-orange-400" },
  { v: "decliner",  l: "À décliner", bg: "bg-red-100   text-red-800   border-red-300",    dot: "bg-red-500"   },
];

const ORIENTATIONS = [
  { v: "evaluation", l: "Évaluation en cours", bg: "bg-orange-100 text-orange-800 border-orange-300", dot: "bg-orange-400" },
  { v: "recrute",    l: "Recruter",             bg: "bg-green-100 text-green-800 border-green-300",   dot: "bg-green-500"  },
  { v: "vivier",     l: "Vivier",               bg: "bg-blue-100  text-blue-800  border-blue-300",    dot: "bg-blue-500"   },
  { v: "decliner",   l: "Décliner",             bg: "bg-red-100   text-red-800   border-red-300",     dot: "bg-red-500"    },
];

// ─── Sélecteur radio visuel ───────────────────────────────────────────────────
function RadioChips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
            value === o.v
              ? o.bg + " shadow-sm ring-1 ring-inset ring-current/30"
              : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${value === o.v ? o.dot : "bg-gray-300"}`} />
          {o.l}
        </button>
      ))}
    </div>
  );
}

// ─── Sélecteur de site (orientation vers un site/activité) ────────────────────
function SiteSelector({ sites, value, onChange }) {
  const filialesList = [...new Set(sites.map(s => s.filiale).filter(Boolean))];
  const [openFil, setOpenFil] = useState(null);

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
        Site / Activité cible
      </label>
      {filialesList.map(fil => {
        const filSites = sites.filter(s => s.filiale === fil);
        const isOpen = openFil === fil;
        const selSite = filSites.find(s => s.id === value);
        return (
          <div key={fil} className="border border-gray-200 rounded-xl overflow-hidden">
            <button type="button"
              onClick={() => setOpenFil(isOpen ? null : fil)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700"
            >
              {fil}
              <span className="flex items-center gap-2">
                {selSite && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{selSite.nom}</span>}
                <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
              </span>
            </button>
            {isOpen && (
              <div className="p-2 space-y-1">
                {filSites.map(s => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-gray-50">
                    <input type="radio" name="orientationSite" value={s.id}
                      checked={value === s.id}
                      onChange={() => { onChange(s.id); setOpenFil(null); }}
                      className="accent-indigo-600"
                    />
                    <span className="text-xs text-gray-700">{s.nom}{s.ville ? ` — ${s.ville}` : ""}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {value && (
        <button type="button" onClick={() => onChange(null)}
          className="text-xs text-red-400 hover:text-red-600">
          ✕ Effacer
        </button>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function FormulaireEntretienCandidat({
  salarie, sites = [], users = [],
  onSaveEntretien, onSaveCandidat, onClose
}) {
  const [typeChoice, setTypeChoice] = useState(null); // null | "tel" | "phys"
  const [form, setForm] = useState({
    date:             todayStr,
    avecQui:          "",
    ou:               "",
    commentaire:      "",
    impression:       "",
    orientation:      "",
    orientationMotif: "",
    orientationSiteId: null,
    assignedTo:       salarie.cip_id || (users[0]?.id ?? ""),
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canSave = form.date && form.avecQui;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setErr("");
    try {
      // 1. Créer l'entretien
      const typeLabel = typeChoice === "tel" ? "Entretien téléphonique" : "Entretien physique";
      const entretien = {
        id:          null,
        salarie_id:  salarie.id,
        cip_id:      form.assignedTo,
        assignedTo:  form.assignedTo,
        date:        form.date,
        type:        typeLabel,
        sujets:      [
          `Avec : ${form.avecQui}`,
          typeChoice === "phys" && form.ou ? `Lieu : ${form.ou}` : null,
        ].filter(Boolean).join(" · "),
        synthese:    form.commentaire,
        participants: form.avecQui,
        jalon:       false,
        objectifs:   [],
      };
      await onSaveEntretien(entretien);

      // 2. Mettre à jour les champs candidat (impression, orientation, date entretien)
      const updates = {
        vuEntretienLe:    form.date,
        impressionGlobale:  form.impression  || salarie.impressionGlobale,
        impressionDetail:   form.commentaire || salarie.impressionDetail,
        orientationCandidat: form.orientation || salarie.orientationCandidat,
        orientationMotif:   form.orientationMotif || salarie.orientationMotif,
        orientationSiteId:  form.orientationSiteId ?? salarie.orientationSiteId,
      };
      await onSaveCandidat(updates);
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:100, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"2rem", overflowY:"auto" }}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl mb-8">

        {/* En-tête */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Entretien candidat</h2>
            <p className="text-sm text-gray-400">{salarie.nom} {salarie.prenom}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* ── Étape 1 : Choisir le type ── */}
          {!typeChoice ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">Type d'entretien</p>
              <div className="grid grid-cols-2 gap-3">
                <button type="button"
                  onClick={() => setTypeChoice("tel")}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                >
                  <span className="text-3xl">📞</span>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700">Téléphonique</p>
                    <p className="text-xs text-gray-400 mt-0.5">Appel téléphonique</p>
                  </div>
                </button>
                <button type="button"
                  onClick={() => setTypeChoice("phys")}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                >
                  <span className="text-3xl">🤝</span>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700">Physique</p>
                    <p className="text-xs text-gray-400 mt-0.5">Entretien en présence</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ── Étape 2 : Formulaire selon type ── */}
              <div className="flex items-center gap-2 mb-1">
                <button type="button" onClick={() => setTypeChoice(null)}
                  className="text-xs text-gray-400 hover:text-indigo-600">← Changer</button>
                <span className="text-sm font-semibold text-gray-800">
                  {typeChoice === "tel" ? "📞 Entretien téléphonique" : "🤝 Entretien physique"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FInput label="Date *" type="date" value={form.date}
                  onChange={e => upd("date", e.target.value)} />
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                    Réalisé par
                  </label>
                  <select value={form.assignedTo} onChange={e => upd("assignedTo", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200">
                    {users.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
                  </select>
                </div>
              </div>

              <FInput label="Avec qui *" required
                value={form.avecQui}
                onChange={e => upd("avecQui", e.target.value)}
                placeholder={typeChoice === "tel" ? "Nom du candidat" : "Nom + fonction"} />

              {typeChoice === "phys" && (
                <FInput label="Lieu"
                  value={form.ou}
                  onChange={e => upd("ou", e.target.value)}
                  placeholder="Ex : Bureau CIP, Firminy" />
              )}

              <FTextarea label="Commentaire / Observations"
                value={form.commentaire}
                onChange={e => upd("commentaire", e.target.value)}
                rows={3}
                placeholder="Résumé de l'échange, points clés…" />

              {/* ── Impression globale ── */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
                  Impression globale
                </label>
                <RadioChips options={IMPRESSIONS} value={form.impression} onChange={v => upd("impression", v)} />
              </div>

              {/* ── Orientation ── */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
                  Avis d'orientation
                </label>
                <RadioChips options={ORIENTATIONS} value={form.orientation} onChange={v => upd("orientation", v)} />
              </div>

              {/* ── Motif orientation ── */}
              {form.orientation && (
                <FInput label="Précision / Motif"
                  value={form.orientationMotif}
                  onChange={e => upd("orientationMotif", e.target.value)}
                  placeholder="Ex : Profil adapté au poste de tri, manque d'expérience…" />
              )}

              {/* ── Site cible (si orientation positive) ── */}
              {(form.orientation === "recrute" || form.orientation === "vivier") && sites.length > 0 && (
                <SiteSelector sites={sites} value={form.orientationSiteId} onChange={v => upd("orientationSiteId", v)} />
              )}

              {err && (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>
              )}
            </>
          )}
        </div>

        {/* Pied de formulaire */}
        {typeChoice && (
          <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Annuler
            </button>
            <button type="button" onClick={handleSave} disabled={!canSave || saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold flex items-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
