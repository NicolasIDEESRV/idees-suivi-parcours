import { useState } from "react";
import { FREINS, FREINS_S, TYPES_SORTIE_PAR_CAT, getTypeSortieASP } from "../lib/constants";
import { todayStr, fmt, daysUntil, urgC } from "../lib/utils";
import { fC } from "../lib/theme";
import { FInput, FCheck, FTextarea } from "./ui";

const CAT_COLORS = {
  "Emplois durables":      "bg-green-50 border-green-200",
  "Emplois de transition": "bg-blue-50 border-blue-200",
  "Sorties positives":     "bg-emerald-50 border-emerald-200",
  "Autres sorties":        "bg-orange-50 border-orange-200",
  "Retraits":              "bg-gray-50 border-gray-200",
};
const CAT_LABEL_COLORS = {
  "Emplois durables":      "text-green-800",
  "Emplois de transition": "text-blue-800",
  "Sorties positives":     "text-emerald-700",
  "Autres sorties":        "text-orange-800",
  "Retraits":              "text-gray-700",
};
const CAT_BTN_SEL = {
  "Emplois durables":      "bg-green-600 text-white border-green-600",
  "Emplois de transition": "bg-blue-600 text-white border-blue-600",
  "Sorties positives":     "bg-emerald-600 text-white border-emerald-600",
  "Autres sorties":        "bg-orange-500 text-white border-orange-500",
  "Retraits":              "bg-gray-600 text-white border-gray-600",
};

export default function FormulaireSortie({ salarie, entretiens, onSave, onClose }) {
  const mesE    = entretiens.filter(e => e.salarie_id === salarie.id);
  const tousObj = mesE.flatMap(e => e.objectifs || []).filter(o => o.intitule);

  const [form, setForm] = useState({
    dateSortie:         todayStr,
    typeSortie:         salarie.typeSortie || "",
    motifSortie:        salarie.situationSortie || "",
    accordSuiviPost:    false,
    accordTransmission: false,
    aRappeler:          false,
    synthBesoinsSortie: "",
    synthParcours:      "",
    freinsSortie:       { ...salarie.freinsSortie },
    objBilan:           tousObj.map(o => ({ ...o })),
  });

  const upd    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updF   = (f, v) => setForm(fm => ({ ...fm, freinsSortie: { ...fm.freinsSortie, [f]: v } }));
  const updObj = (id, k, v) => setForm(fm => ({ ...fm, objBilan: fm.objBilan.map(o => o.id === id ? { ...o, [k]: v } : o) }));

  const selectedASP = getTypeSortieASP(form.typeSortie);

  const handleSave = () => onSave({ ...form, situationSortie: form.motifSortie });

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:100, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"2rem", overflowY:"auto" }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl mb-8">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Bilan de sortie</h2>
            <p className="text-sm text-gray-400">{salarie.nom} {salarie.prenom}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 text-2xl">×</button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[70vh] space-y-5">

          <FInput label="Date de sortie" type="date" value={form.dateSortie} onChange={e => upd("dateSortie", e.target.value)} />

          {/* ── Sélecteur de type ASP par catégorie ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Type de sortie ASP</p>
            <div className="space-y-2">
              {Object.entries(TYPES_SORTIE_PAR_CAT).map(([cat, types]) => (
                <div key={cat} className={`rounded-xl border p-3 ${CAT_COLORS[cat]}`}>
                  <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${CAT_LABEL_COLORS[cat]}`}>{cat}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {types.map(t => (
                      <button key={t.code}
                        onClick={() => upd("typeSortie", form.typeSortie === t.code ? "" : t.code)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          form.typeSortie === t.code ? CAT_BTN_SEL[cat] : "bg-white/80 text-gray-600 border-gray-200 hover:border-gray-400"
                        }`}
                        title={`Code ASP : ${t.codeASP}`}
                      >
                        {t.label} <span className="opacity-40 text-[10px]">#{t.codeASP}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Motif (affiché quand un type est sélectionné) ── */}
          {selectedASP && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-bold text-indigo-800">
                {selectedASP.label}
                <span className="ml-2 text-xs font-normal text-indigo-400">#{selectedASP.codeASP} — {selectedASP.categorie}</span>
              </p>
              <div>
                <label className="text-xs font-semibold text-indigo-700 block mb-1">
                  Motif <span className="font-normal text-indigo-400">({selectedASP.motifGuidance})</span>
                </label>
                <textarea rows={2} value={form.motifSortie} onChange={e => upd("motifSortie", e.target.value)}
                  placeholder={selectedASP.motifGuidance}
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </div>
            </div>
          )}

          {/* ── Bilan des objectifs ── */}
          {tousObj.length > 0 && (
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 border-b border-indigo-100 pb-1">Bilan des objectifs</p>
              <div className="space-y-2">
                {form.objBilan.map(o => {
                  const d = daysUntil(o.deadline);
                  return (
                    <div key={o.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{o.intitule}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium inline-block mt-1 ${urgC(d)}`}>{fmt(o.deadline)}</span>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button type="button" onClick={() => updObj(o.id, "atteint", o.atteint === true ? null : true)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${o.atteint === true ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500 border-gray-300"}`}
                          >✓ Atteint</button>
                          <button type="button" onClick={() => updObj(o.id, "atteint", o.atteint === false ? null : false)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${o.atteint === false ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-500 border-gray-300"}`}
                          >✗ Non atteint</button>
                        </div>
                      </div>
                      {o.atteint !== null && (
                        <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs mt-2 bg-white"
                          placeholder="Commentaire…" value={o.commentaire || ""}
                          onChange={e => updObj(o.id, "commentaire", e.target.value)} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Freins à la sortie ── */}
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 border-b border-indigo-100 pb-1">Freins à la sortie</p>
            <div className="space-y-2">
              {FREINS.map(f => (
                <div key={f} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-44 shrink-0">{f}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${fC[salarie.freinsEntree?.[f] || ""]}`}>{salarie.freinsEntree?.[f] || "—"}</span>
                  <span className="text-gray-200">→</span>
                  <div className="flex gap-1">
                    {FREINS_S.map(s => (
                      <button key={s} onClick={() => updF(f, form.freinsSortie[f] === s ? "" : s)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium border ${form.freinsSortie[f] === s ? fC[s] + " border-current" : "bg-gray-50 text-gray-400 border-gray-200"}`}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <FTextarea label="Synthèse besoins sortie" value={form.synthBesoinsSortie} onChange={e => upd("synthBesoinsSortie", e.target.value)} />
          <FTextarea label="Synthèse du parcours"    value={form.synthParcours}       onChange={e => upd("synthParcours",       e.target.value)} />

          <div className="space-y-3">
            <FCheck label="Accepte le suivi post-sortie"     checked={form.accordSuiviPost}    onChange={e => upd("accordSuiviPost",    e.target.checked)} />
            <FCheck label="Accepte la transmission du bilan" checked={form.accordTransmission} onChange={e => upd("accordTransmission", e.target.checked)} />
            <FCheck label="À rappeler"                       checked={form.aRappeler}          onChange={e => upd("aRappeler",          e.target.checked)} />
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-between">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100">Annuler</button>
          <button onClick={handleSave} className="px-5 py-2 rounded-xl text-sm bg-red-600 text-white font-medium hover:bg-red-700">✓ Valider la sortie</button>
        </div>
      </div>
    </div>
  );
}
