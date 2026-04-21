import { useState } from "react";
import { PRESCRIPTEURS, NIVEAUX, FREINS, FREINS_E, NIVEAUX_LANGUE, DOMAINES_PRO, MOYENS_TRANSPORT, JALONS_DEF } from "../lib/constants";
import { fmt, addDays } from "../lib/utils";
import { fC } from "../lib/theme";
import { newSal } from "../lib/data";
import { FInput, FSelect, FCheck, FTextarea, FSec } from "./ui";

export default function FormulaireNouveauSalarie({ initial, sites, onSave, onClose, user }) {
  const [form, setForm] = useState(initial || newSal({ site_id: user.site_id || "s1", cip_id: user.id }));
  const [step, setStep] = useState(0);

  const upd  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updF = (t, f, v) => setForm(fm => ({ ...fm, [t]: { ...fm[t], [f]: v } }));

  const STEPS = ["Identité & parcours", "Situation", "Formation & mobilité", "Freins & projet", "Résumé"];
  const ok = form.nom && form.prenom && form.dateEntree && form.prescripteur;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem", overflowY: "auto" }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl mb-8">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{initial?.id ? "Modifier" : "Nouveau salarié"}</h2>
            <p className="text-sm text-gray-400">{STEPS[step]} — {step + 1}/{STEPS.length}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 text-2xl">×</button>
        </div>

        <div className="px-5 pt-3">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-indigo-500" : "bg-gray-100"}`} />)}
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <FSec>État civil</FSec>
              <FInput label="NOM" required value={form.nom}    onChange={e => upd("nom",    e.target.value.toUpperCase())} />
              <FInput label="Prénom"  required value={form.prenom} onChange={e => upd("prenom", e.target.value)} />
              <FInput label="Date de naissance" type="date"   value={form.dateNaissance}  onChange={e => upd("dateNaissance", e.target.value)} />
              <FSelect label="Sexe" value={form.sexe} onChange={e => upd("sexe", e.target.value)}>
                <option value="">—</option><option>F</option><option>M</option>
              </FSelect>
              <FInput label="Téléphone" value={form.telephone} onChange={e => upd("telephone", e.target.value)} />
              <FInput label="Mail"      value={form.mail}      onChange={e => upd("mail",      e.target.value)} />
              <FSec>Parcours</FSec>
              <FInput label="Date d'entrée"  required type="date" value={form.dateEntree}    onChange={e => upd("dateEntree",    e.target.value)} />
              <FInput label="Fin de contrat"          type="date" value={form.dateFinContrat} onChange={e => upd("dateFinContrat", e.target.value)} />
              <FInput label="Fin d'agrément"          type="date" value={form.dateFinAgrement} onChange={e => upd("dateFinAgrement", e.target.value)} />
              <FSelect label="Prescripteur" required value={form.prescripteur} onChange={e => upd("prescripteur", e.target.value)}>
                {PRESCRIPTEURS.map(p => <option key={p}>{p}</option>)}
              </FSelect>
              <FInput label="Référent prescripteur" value={form.nomPrenomPrescripteur} onChange={e => upd("nomPrenomPrescripteur", e.target.value)} />
              {user.role === "admin" && (
                <FSelect label="Site" value={form.site_id} onChange={e => upd("site_id", e.target.value)}>
                  <option value="">— Sélectionner un site —</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>
                      {[s.filiale, s.secteur !== s.activite ? s.activite : null, s.nom].filter(Boolean).join(" › ")}
                    </option>
                  ))}
                </FSelect>
              )}
              <FSec>Publics prioritaires</FSec>
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <FCheck label="DELD"          checked={form.deld}         onChange={e => upd("deld",         e.target.checked)} />
                <FCheck label="BRSA"          checked={form.brsa}         onChange={e => upd("brsa",         e.target.checked)} />
                <FCheck label="TH / RQTH"     checked={form.th}           onChange={e => upd("th",           e.target.checked)} />
                <FCheck label="ASS"           checked={form.ass}          onChange={e => upd("ass",          e.target.checked)} />
                <FCheck label="Sans ressources" checked={form.sansRessources} onChange={e => upd("sansRessources", e.target.checked)} />
                <FCheck label="Résident QPV"  checked={form.residentQPV}  onChange={e => upd("residentQPV",  e.target.checked)} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <FSec>Situation familiale</FSec>
              <FSelect label="Situation maritale" value={form.situationMaritale} onChange={e => upd("situationMaritale", e.target.value)}>
                <option value="">—</option>
                {["Célibataire","En couple","Marié(e)","Divorcé(e)","Veuf/veuve"].map(v => <option key={v}>{v}</option>)}
              </FSelect>
              <FInput label="Nb enfants" type="number" min="0" value={form.nbEnfants} onChange={e => upd("nbEnfants", +e.target.value)} />
              <FSec>Logement &amp; Santé</FSec>
              <FSelect label="Hébergement" value={form.hebergement} onChange={e => upd("hebergement", e.target.value)}>
                <option value="">—</option>
                {["Locataire","Propriétaire","Hébergé (famille)","Hébergé (tiers)","CHRS","SDF","Autre"].map(v => <option key={v}>{v}</option>)}
              </FSelect>
              <div>
                <FCheck label="CSS / Mutuelle" checked={form.css} onChange={e => upd("css", e.target.checked)} />
                {form.css && <div className="mt-2"><FInput label="Jusqu'au" type="date" value={form.cssJusquau} onChange={e => upd("cssJusquau", e.target.value)} /></div>}
              </div>
              <FSec>Ressources</FSec>
              <FInput label="Revenus (€/mois)" type="number" value={form.revenus} onChange={e => upd("revenus", +e.target.value)} />
              <FInput label="Charges (€/mois)" type="number" value={form.charges} onChange={e => upd("charges", +e.target.value)} />
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <FSec>Formation</FSec>
              <FSelect label="Niveau de formation" value={form.niveauFormation} onChange={e => upd("niveauFormation", e.target.value)}>
                {NIVEAUX.map(n => <option key={n}>{n}</option>)}
              </FSelect>
              <FSelect label="Niveau de langue" value={form.niveauLangue} onChange={e => upd("niveauLangue", e.target.value)}>
                {NIVEAUX_LANGUE.map(n => <option key={n}>{n}</option>)}
              </FSelect>
              <div className="col-span-2 flex gap-6">
                <FCheck label="Lecture"  checked={form.lecture}  onChange={e => upd("lecture",  e.target.checked)} />
                <FCheck label="Écriture" checked={form.ecriture} onChange={e => upd("ecriture", e.target.checked)} />
                <FCheck label="Calcul"   checked={form.calcul}   onChange={e => upd("calcul",   e.target.checked)} />
              </div>
              <FInput label="Diplômes" value={form.diplomes} onChange={e => upd("diplomes", e.target.value)} />
              <div><FCheck label="CV disponible" checked={form.cv} onChange={e => upd("cv", e.target.checked)} /></div>
              <FSec>Mobilité</FSec>
              <div className="col-span-2 flex gap-6">
                <FCheck label="Permis B"         checked={form.permisB}  onChange={e => upd("permisB",  e.target.checked)} />
                <FCheck label="Véhicule personnel" checked={form.vehicule} onChange={e => upd("vehicule", e.target.checked)} />
              </div>
              <FSelect label="Moyen de transport" value={form.moyenTransport} onChange={e => upd("moyenTransport", e.target.value)}>
                <option value="">—</option>
                {MOYENS_TRANSPORT.map(m => <option key={m}>{m}</option>)}
              </FSelect>
              <FInput label="Zone de déplacement" value={form.deplacements} onChange={e => upd("deplacements", e.target.value)} />
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <FSec>Freins à l&apos;entrée</FSec>
              {FREINS.map(f => (
                <div key={f}>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1">{f}</label>
                  <div className="flex gap-1 flex-wrap">
                    {FREINS_E.map(s => (
                      <button key={s} onClick={() => updF("freinsEntree", f, form.freinsEntree[f] === s ? "" : s)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium border ${form.freinsEntree[f] === s ? fC[s] + " border-current" : "bg-gray-50 text-gray-400 border-gray-200"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <FSec>Projet professionnel</FSec>
              <div className="col-span-2">
                <FInput label="Projet professionnel" value={form.projetPro} onChange={e => upd("projetPro", e.target.value)} />
              </div>
              {[0, 1, 2].map(i => (
                <FSelect key={i} label={`Domaine ${i + 1}`} value={form.domainesPro[i] || ""} onChange={e => { const d = [...form.domainesPro]; d[i] = e.target.value; upd("domainesPro", d); }}>
                  <option value="">—</option>
                  {DOMAINES_PRO.map(d => <option key={d}>{d}</option>)}
                </FSelect>
              ))}
              <div className="col-span-2">
                <FInput label="Préconisation" value={form.preconisation} onChange={e => upd("preconisation", e.target.value)} />
              </div>
              <div className="col-span-2">
                <FTextarea label="Synthèse des besoins à l'entrée" value={form.synthBesoinsEntree} onChange={e => upd("synthBesoinsEntree", e.target.value)} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <h3 className="font-semibold text-indigo-900 mb-3">Récapitulatif</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Nom :</span> <strong>{form.nom} {form.prenom}</strong></div>
                  <div><span className="text-gray-500">Entrée :</span> {fmt(form.dateEntree)}</div>
                  <div><span className="text-gray-500">Prescripteur :</span> {form.prescripteur}</div>
                  <div><span className="text-gray-500">Projet :</span> {form.projetPro || "—"}</div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {form.deld && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">DELD</span>}
                  {form.brsa && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">BRSA</span>}
                  {form.th   && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">TH</span>}
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-sm font-semibold text-amber-900 mb-2">📅 4 entretiens jalons seront planifiés</p>
                {JALONS_DEF.map(j => (
                  <div key={j.key} className="text-xs text-amber-700 flex justify-between py-1 border-b border-amber-100 last:border-0">
                    <span>{j.label}</span>
                    <span>{fmt(addDays(form.dateEntree, j.offsetDays))}</span>
                  </div>
                ))}
              </div>
              {!ok && <p className="text-sm text-orange-600 bg-orange-50 rounded-xl px-4 py-3">⚠ Champs obligatoires manquants.</p>}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-between">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : onClose()} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100">
            {step === 0 ? "Annuler" : "← Précédent"}
          </button>
          {step < STEPS.length - 1
            ? <button onClick={() => setStep(s => s + 1)} className="px-5 py-2 rounded-xl text-sm bg-indigo-600 text-white font-medium">Suivant →</button>
            : <button onClick={() => ok && onSave(form)} disabled={!ok} className="px-5 py-2 rounded-xl text-sm bg-green-600 text-white font-medium disabled:opacity-40">✓ Enregistrer</button>
          }
        </div>
      </div>
    </div>
  );
}
