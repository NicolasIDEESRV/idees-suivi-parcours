import { useState } from "react";
import { PRESCRIPTEURS, NIVEAUX, FREINS, FREINS_E, NIVEAUX_LANGUE, DOMAINES_PRO, MOYENS_TRANSPORT, JALONS_DEF } from "../lib/constants";
import { fmt, addDays } from "../lib/utils";
import { fC } from "../lib/theme";
import { newSal } from "../lib/data";
import { checkNumSecuUnique } from "../lib/api/salaries";
import { FInput, FSelect, FCheck, FTextarea, FSec } from "./ui";

// ─── Sélecteur multi-sites (Activités PRIO pour candidats) ──────────────────
function ActivitesPrioSelector({ sites, value = [], onChange }) {
  const filialesList = [...new Set(sites.map(s => s.filiale).filter(Boolean))];
  const [openFil, setOpenFil] = useState(null);

  const toggle = (siteId) => {
    onChange(value.includes(siteId) ? value.filter(id => id !== siteId) : [...value, siteId]);
  };

  return (
    <div className="space-y-2">
      {filialesList.map(fil => {
        const filSites = sites.filter(s => s.filiale === fil);
        const isOpen   = openFil === fil;
        const selCount = filSites.filter(s => value.includes(s.id)).length;
        return (
          <div key={fil} className="border border-gray-200 rounded-xl overflow-hidden">
            <button type="button"
              onClick={() => setOpenFil(isOpen ? null : fil)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-xs font-semibold text-gray-700">{fil}</span>
              <div className="flex items-center gap-2">
                {selCount > 0 && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{selCount} sélectionné{selCount > 1 ? "s" : ""}</span>
                )}
                <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
              </div>
            </button>
            {isOpen && (
              <div className="p-2 space-y-1">
                {filSites.map(s => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-gray-50">
                    <input type="checkbox"
                      checked={value.includes(s.id)}
                      onChange={() => toggle(s.id)}
                      className="rounded border-gray-300 accent-indigo-600"
                    />
                    <span className="text-xs text-gray-700">
                      {[s.secteur !== s.activite ? s.activite : null, s.nom].filter(Boolean).join(" › ")}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {value.map(id => {
            const s = sites.find(x => x.id === id);
            if (!s) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded-full border border-indigo-200">
                {[s.filiale, s.nom].filter(Boolean).join(" › ")}
                <button type="button" onClick={() => toggle(id)} className="ml-0.5 text-indigo-400 hover:text-red-500">×</button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Formulaire principal ─────────────────────────────────────────────────────
export default function FormulaireNouveauSalarie({ initial, sites, onSave, onClose, user }) {
  const [form,    setForm]    = useState(initial || newSal({ site_id: user.site_id || "", cip_id: user.id }));
  const [step,    setStep]    = useState(0);
  const [saveErr, setSaveErr] = useState("");
  const [saving,  setSaving]  = useState(false);

  const upd  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updF = (t, f, v) => setForm(fm => ({ ...fm, [t]: { ...fm[t], [f]: v } }));

  // ── Étapes selon type ──────────────────────────────────────────────────────
  const STEPS = form.isCandidat
    ? ["Identité", "Situation", "Formation & mobilité", "Freins & projet", "Candidature", "Résumé"]
    : ["Identité & parcours", "Situation", "Formation & mobilité", "Freins & projet", "Résumé"];

  // ── Sites accessibles selon le rôle ───────────────────────────────────────
  const accessibleSites = user.role === "admin"
    ? sites
    : sites.filter(s => (user.site_ids?.length ? user.site_ids : (user.site_id ? [user.site_id] : [])).includes(s.id));

  // ── Validation obligatoires ────────────────────────────────────────────────
  const okBase = !!(form.nom && form.prenom && form.telephone && form.numSecuSociale);
  const okCandidat = okBase && !!(form.candidatureRecueLe) && form.activitesPrio.length > 0 &&
    (!form.vuEntretienLe || (form.impressionGlobale && form.orientationCandidat && form.orientationSiteId));
  const okSal = okBase && !!(form.dateEntree && form.dateFinContrat && form.dateFinAgrement && form.site_id);
  const ok = form.isCandidat ? okCandidat : okSal;

  // ── Enregistrement avec vérification unicité ───────────────────────────────
  const handleSubmit = async () => {
    if (!ok) return;
    setSaveErr("");
    setSaving(true);
    try {
      // Vérifier unicité du numéro de sécurité sociale
      if (form.numSecuSociale) {
        const dupes = await checkNumSecuUnique(form.numSecuSociale, form.id || null);
        if (dupes.length > 0) {
          const d = dupes[0];
          const site = sites.find(s => s.id === d.site_id);
          const siteLabel = site
            ? [site.filiale, site.secteur, site.activite, site.nom].filter(Boolean).join(" › ")
            : "—";
          setSaveErr(
            `N° de sécurité sociale déjà enregistré pour ${d.nom} ${d.prenom} ` +
            `(${d.is_candidat ? "Candidat" : "Salarié"} · ${siteLabel})`
          );
          return;
        }
      }
      onSave(form);
    } catch (e) {
      setSaveErr("Erreur lors de la vérification : " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:100, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"2rem", overflowY:"auto" }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl mb-8">

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              {initial?.id ? "Modifier" : form.isCandidat ? "Nouveau candidat" : "Nouveau salarié"}
            </h2>
            <p className="text-sm text-gray-400">{STEPS[step]} — {step + 1}/{STEPS.length}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 text-2xl hover:text-gray-500">×</button>
        </div>

        {/* ── Barre de progression ── */}
        <div className="px-5 pt-3">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-indigo-500" : "bg-gray-100"}`} />
            ))}
          </div>
        </div>

        {/* ── Contenu ── */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* ═══════════════════════════════════════════════════
              ÉTAPE 0 — Identité (commune + spécifique par type)
          ═══════════════════════════════════════════════════ */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <FSec>État civil</FSec>
              <FInput label="NOM *"    required value={form.nom}    onChange={e => upd("nom",    e.target.value.toUpperCase())} />
              <FInput label="Prénom *" required value={form.prenom} onChange={e => upd("prenom", e.target.value)} />
              <FInput label="Téléphone *" required value={form.telephone} onChange={e => upd("telephone", e.target.value)} />
              <FInput label="Mail" value={form.mail} onChange={e => upd("mail", e.target.value)} />
              <FInput label="Date de naissance" type="date" value={form.dateNaissance} onChange={e => upd("dateNaissance", e.target.value)} />
              <FSelect label="Sexe" value={form.sexe} onChange={e => upd("sexe", e.target.value)}>
                <option value="">—</option><option>F</option><option>M</option>
              </FSelect>

              {/* N° de sécurité sociale — obligatoire pour les deux types */}
              <div className="col-span-2">
                <FInput label="N° Sécurité sociale *" required
                  value={form.numSecuSociale}
                  onChange={e => upd("numSecuSociale", e.target.value.trim())}
                  placeholder="1 84 12 75 108 042 68"
                />
                {saveErr && (
                  <p className="mt-1 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{saveErr}</p>
                )}
              </div>

              {/* ── Champs SALARIÉ uniquement ── */}
              {!form.isCandidat && (
                <>
                  <FSec>Parcours</FSec>
                  <FInput label="Date d'entrée *"   required type="date" value={form.dateEntree}     onChange={e => upd("dateEntree",     e.target.value)} />
                  <FInput label="Fin de contrat *"  required type="date" value={form.dateFinContrat}  onChange={e => upd("dateFinContrat",  e.target.value)} />
                  <FInput label="Fin d'agrément *"  required type="date" value={form.dateFinAgrement} onChange={e => upd("dateFinAgrement", e.target.value)} />
                  <FSelect label="Prescripteur" value={form.prescripteur} onChange={e => upd("prescripteur", e.target.value)}>
                    {PRESCRIPTEURS.map(p => <option key={p}>{p}</option>)}
                  </FSelect>
                  <FInput label="Référent prescripteur" value={form.nomPrenomPrescripteur} onChange={e => upd("nomPrenomPrescripteur", e.target.value)} />

                  {/* Site — visible pour tous les rôles, obligatoire */}
                  <FSelect label={`Site *${accessibleSites.length <= 1 ? " (auto)" : ""}`}
                    required
                    value={form.site_id || ""}
                    onChange={e => upd("site_id", e.target.value)}
                    disabled={accessibleSites.length === 1}
                  >
                    <option value="">— Sélectionner un site —</option>
                    {accessibleSites.map(s => (
                      <option key={s.id} value={s.id}>
                        {[s.filiale, s.secteur !== s.activite ? s.activite : null, s.nom].filter(Boolean).join(" › ")}
                      </option>
                    ))}
                  </FSelect>
                </>
              )}

              <FSec>Publics prioritaires</FSec>
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <FCheck label="DELD"         checked={form.deld}        onChange={e => upd("deld",        e.target.checked)} />
                <FCheck label="TH / RQTH"    checked={form.th}          onChange={e => upd("th",          e.target.checked)} />
                <FCheck label="Résident QPV" checked={form.residentQPV} onChange={e => upd("residentQPV", e.target.checked)} />
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-600 mb-2">Allocation / Ressources <span className="text-gray-400">(un seul choix)</span></p>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { key: "brsa",           label: "BRSA" },
                    { key: "ass",            label: "ASS" },
                    { key: "sansRessources", label: "Sans ressources" },
                  ].map(({ key, label }) => (
                    <button key={key} type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        brsa:          key === "brsa"           ? !f.brsa          : false,
                        ass:           key === "ass"            ? !f.ass           : false,
                        sansRessources:key === "sansRessources" ? !f.sansRessources: false,
                      }))}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        form[key] ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                      }`}
                    >{label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              ÉTAPE 1 — Situation
          ═══════════════════════════════════════ */}
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

          {/* ═══════════════════════════════════════
              ÉTAPE 2 — Formation & mobilité
          ═══════════════════════════════════════ */}
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
                <FCheck label="Permis B"           checked={form.permisB}  onChange={e => upd("permisB",  e.target.checked)} />
                <FCheck label="Véhicule personnel" checked={form.vehicule} onChange={e => upd("vehicule", e.target.checked)} />
              </div>
              <FSelect label="Moyen de transport" value={form.moyenTransport} onChange={e => upd("moyenTransport", e.target.value)}>
                <option value="">—</option>
                {MOYENS_TRANSPORT.map(m => <option key={m}>{m}</option>)}
              </FSelect>
              <FInput label="Zone de déplacement" value={form.deplacements} onChange={e => upd("deplacements", e.target.value)} />
            </div>
          )}

          {/* ═══════════════════════════════════════
              ÉTAPE 3 — Freins & projet
          ═══════════════════════════════════════ */}
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
                      >{s}</button>
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

          {/* ═══════════════════════════════════════
              ÉTAPE 4 — Candidature (candidats uniquement)
          ═══════════════════════════════════════ */}
          {step === 4 && form.isCandidat && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FSec>Dates</FSec>
                <FInput label="Candidature reçue le *" required type="date" value={form.candidatureRecueLe} onChange={e => upd("candidatureRecueLe", e.target.value)} />
                <FInput label="Appeler le"              type="date" value={form.appelerLe}           onChange={e => upd("appelerLe",           e.target.value)} />
                <FInput label="Vu en entretien le"      type="date" value={form.vuEntretienLe}       onChange={e => upd("vuEntretienLe",       e.target.value)} />
              </div>

              {/* Activités prioritaires — obligatoire */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Activité(s) prioritaire(s) *
                  <span className="text-gray-400 normal-case font-normal ml-1">— Sélectionner une ou plusieurs filiales/activités</span>
                </p>
                <ActivitesPrioSelector
                  sites={sites}
                  value={form.activitesPrio}
                  onChange={v => upd("activitesPrio", v)}
                />
                {form.activitesPrio.length === 0 && (
                  <p className="text-xs text-orange-500 mt-1">Sélectionnez au moins une activité prioritaire.</p>
                )}
              </div>

              {/* Impression globale — obligatoire si entretien renseigné */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Impression globale{form.vuEntretienLe ? " *" : ""}
                </p>
                <div className="space-y-2">
                  {[
                    { val: "tres_bien", label: "Très bien",  sub: "Motivation claire, projet cohérent",          color: "border-green-300"  },
                    { val: "bien",      label: "Bien",        sub: "Bon profil, quelques points à consolider",    color: "border-blue-300"   },
                    { val: "doute",     label: "Doute sur…",  sub: "Réserve(s) identifiée(s) — préciser",         color: "border-orange-300" },
                    { val: "decliner",  label: "À décliner",  sub: "Candidature non retenue",                     color: "border-red-300"    },
                  ].map(opt => (
                    <label key={opt.val} className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${form.impressionGlobale === opt.val ? opt.color + " bg-gray-50" : "border-gray-200 hover:" + opt.color}`}>
                      <input type="radio" name="impression" value={opt.val}
                        checked={form.impressionGlobale === opt.val}
                        onChange={() => upd("impressionGlobale", opt.val)}
                        className="mt-0.5 accent-indigo-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-400">{opt.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {(form.impressionGlobale === "doute" || form.impressionGlobale === "decliner") && (
                  <div className="mt-3">
                    <FInput label={form.impressionGlobale === "doute" ? "Réserve(s) identifiée(s)" : "Motif de déclin"}
                      value={form.impressionDetail} onChange={e => upd("impressionDetail", e.target.value)} />
                  </div>
                )}
              </div>

              {/* Orientation — obligatoire si entretien renseigné */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Orientation{form.vuEntretienLe ? " *" : ""}
                </p>
                <div className="space-y-2">
                  {[
                    { val: "recrute",  label: "Recruté",   sub: "Intégration en CDDI ID'EES",                    color: "border-green-300"  },
                    { val: "vivier",   label: "Vivier",     sub: "Profil à rappeler lors d'une prochaine ouverture", color: "border-blue-300"  },
                    { val: "interim",  label: "Intérim ?",  sub: "À explorer via ID'EES Intérim",                 color: "border-purple-300" },
                    { val: "decliner", label: "Décliner",   sub: "Motif à préciser ci-dessous",                   color: "border-red-300"    },
                  ].map(opt => (
                    <label key={opt.val} className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${form.orientationCandidat === opt.val ? opt.color + " bg-gray-50" : "border-gray-200 hover:" + opt.color}`}>
                      <input type="radio" name="orientation" value={opt.val}
                        checked={form.orientationCandidat === opt.val}
                        onChange={() => upd("orientationCandidat", opt.val)}
                        className="mt-0.5 accent-indigo-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-400">{opt.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {(form.orientationCandidat === "decliner" || form.orientationCandidat === "vivier") && (
                  <div className="mt-3">
                    <FInput label={form.orientationCandidat === "decliner" ? "Motif de déclin" : "Note vivier"}
                      value={form.orientationMotif} onChange={e => upd("orientationMotif", e.target.value)} />
                  </div>
                )}
              </div>

              {/* Orientation SECTEUR — obligatoire si entretien renseigné */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Orientation SECTEUR{form.vuEntretienLe ? " *" : ""}
                </p>
                <FSelect label="Site / Activité cible" value={form.orientationSiteId || ""} onChange={e => upd("orientationSiteId", e.target.value || null)}>
                  <option value="">— Sélectionner un site —</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>
                      {[s.filiale, s.secteur !== s.activite ? s.activite : null, s.nom].filter(Boolean).join(" › ")}
                    </option>
                  ))}
                </FSelect>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              RÉSUMÉ — salarié
          ═══════════════════════════════════════ */}
          {step === STEPS.length - 1 && !form.isCandidat && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <h3 className="font-semibold text-indigo-900 mb-3">Récapitulatif</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Nom :</span> <strong>{form.nom} {form.prenom}</strong></div>
                  <div><span className="text-gray-500">Entrée :</span> {fmt(form.dateEntree)}</div>
                  <div><span className="text-gray-500">Fin contrat :</span> {fmt(form.dateFinContrat)}</div>
                  <div><span className="text-gray-500">Fin agrément :</span> {fmt(form.dateFinAgrement)}</div>
                  <div><span className="text-gray-500">N° SS :</span> {form.numSecuSociale || "—"}</div>
                  <div><span className="text-gray-500">Projet :</span> {form.projetPro || "—"}</div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {form.deld && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">DELD</span>}
                  {form.brsa && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">BRSA</span>}
                  {form.th   && <span className="text-xs bg-blue-100  text-blue-700  px-2 py-0.5 rounded-full">TH</span>}
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
              {!ok && <p className="text-sm text-orange-600 bg-orange-50 rounded-xl px-4 py-3">⚠ Champs obligatoires manquants (marqués *).</p>}
              {saveErr && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{saveErr}</p>}
            </div>
          )}

          {/* ═══════════════════════════════════════
              RÉSUMÉ — candidat
          ═══════════════════════════════════════ */}
          {step === STEPS.length - 1 && form.isCandidat && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <h3 className="font-semibold text-purple-900 mb-3">Récapitulatif candidat</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Nom :</span> <strong>{form.nom} {form.prenom}</strong></div>
                  <div><span className="text-gray-500">N° SS :</span> {form.numSecuSociale || "—"}</div>
                  <div><span className="text-gray-500">Candidature :</span> {fmt(form.candidatureRecueLe) || "—"}</div>
                  <div><span className="text-gray-500">Entretien :</span> {fmt(form.vuEntretienLe) || "—"}</div>
                  <div><span className="text-gray-500">Impression :</span> {form.impressionGlobale || "—"}</div>
                  <div><span className="text-gray-500">Orientation :</span> {form.orientationCandidat || "—"}</div>
                </div>
                {form.activitesPrio.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Activités prioritaires :</p>
                    <div className="flex flex-wrap gap-1">
                      {form.activitesPrio.map(id => {
                        const s = sites.find(x => x.id === id);
                        return s ? (
                          <span key={id} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            {[s.filiale, s.nom].filter(Boolean).join(" › ")}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
              {!ok && <p className="text-sm text-orange-600 bg-orange-50 rounded-xl px-4 py-3">⚠ Champs obligatoires manquants (marqués *).</p>}
              {saveErr && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{saveErr}</p>}
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <div className="p-5 border-t border-gray-100 flex justify-between">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100"
          >
            {step === 0 ? "Annuler" : "← Précédent"}
          </button>
          {step < STEPS.length - 1
            ? <button onClick={() => setStep(s => s + 1)} className="px-5 py-2 rounded-xl text-sm bg-indigo-600 text-white font-medium">Suivant →</button>
            : <button
                onClick={handleSubmit}
                disabled={!ok || saving}
                className="px-5 py-2 rounded-xl text-sm bg-green-600 text-white font-medium disabled:opacity-40 flex items-center gap-2"
              >
                {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                ✓ Enregistrer
              </button>
          }
        </div>
      </div>
    </div>
  );
}
