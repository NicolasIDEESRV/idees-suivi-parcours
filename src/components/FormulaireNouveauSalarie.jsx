import { useState, useCallback } from "react";
import { PRESCRIPTEURS, NIVEAUX, FREINS, FREINS_E, NIVEAUX_LANGUE, DOMAINES_PRO, MOYENS_TRANSPORT, JALONS_DEF } from "../lib/constants";
import { fmt, addDays, todayStr } from "../lib/utils";
import { fC } from "../lib/theme";
import { newSal } from "../lib/data";
import { checkNumSecuUnique, getSalarieById } from "../lib/api/salaries";
import { FInput, FSelect, FCheck, FTextarea, FSec, SiteOptions } from "./ui";

function SectionTitle({ children }) {
  return <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 mb-2">{children}</p>;
}

// ─── Champs à pré-remplir depuis un ancien passage ───────────────────────────
// Identité + situation + formation + mobilité + projet ; on exclut les champs
// spécifiques au nouveau passage (dates contrat, candidatureRecueLe, site_id…)
const PREFILL_KEYS = [
  "nom","prenom","sexe","dateNaissance","nationalite",
  "adresse","cp","ville","telephone","mail",
  "deld","th","rqth","ass","sansRessources","residentQPV","brsa",
  "prescripteur","nomPrenomPrescripteur","autreAccompagnateur",
  "situationMaritale","nbEnfants","hebergement",
  "css","cssJusquau","revenus","charges",
  "niveauFormation","niveauLangue","lecture","ecriture","calcul","diplomes","cv",
  "permisB","vehicule","moyenTransport","deplacements",
  "freinsEntree","projetPro","domainesPro","preconisation","synthBesoinsEntree",
];

// ─── Modale de confirmation récupération ─────────────────────────────────────
function ModalRecuperer({ dupe, onRecuperer, onIgnorer, onClose, loading }) {
  const typLabel = dupe.is_candidat ? "candidat(e)" : "salarié(e)";
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🔄</span>
          <div>
            <h3 className="font-bold text-gray-900">Fiche existante trouvée</h3>
            <p className="text-sm text-gray-500 mt-0.5">Ce numéro correspond à un ancien passage</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1 text-sm">
          <p className="font-semibold text-amber-900">{dupe.prenom} {dupe.nom}</p>
          <p className="text-amber-700">Ancien(ne) {typLabel}</p>
          {dupe.date_entree && (
            <p className="text-amber-700 text-xs">
              Passage du <strong>{fmt(dupe.date_entree)}</strong>
              {dupe.date_sortie ? <> au <strong>{fmt(dupe.date_sortie)}</strong></> : " — en cours"}
            </p>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Souhaitez-vous récupérer ses données (identité, situation, compétences, mobilité…) pour pré-remplir ce nouveau dossier ?
        </p>
        <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
          Une <strong>nouvelle fiche indépendante</strong> sera créée. L'ancienne reste intacte. L'historique des entretiens précédents sera accessible dans la nouvelle fiche.
        </p>
        <div className="flex gap-3 pt-1">
          <button onClick={onIgnorer} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Créer sans récupérer
          </button>
          <button onClick={onRecuperer} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            ✓ Récupérer les données
          </button>
        </div>
        <button onClick={onClose} className="w-full text-xs text-gray-400 hover:text-gray-600 pt-1">Annuler</button>
      </div>
    </div>
  );
}

// ─── Formulaire principal ─────────────────────────────────────────────────────
export default function FormulaireNouveauSalarie({
  initial, sites, onSave, onSaveEntretien, onClose, user, users = []
}) {
  // ── Sites accessibles selon le rôle ───────────────────────────────────────
  const accessibleSites = user.role === "admin"
    ? sites
    : sites.filter(s => (user.site_ids?.length ? user.site_ids : (user.site_id ? [user.site_id] : [])).includes(s.id));

  const initForm = initial || newSal({ site_id: user.site_id || "", cip_id: user.id });
  const autoSiteId = !initForm.site_id && accessibleSites.length === 1 ? accessibleSites[0].id : (initForm.site_id || "");
  const [form, setForm] = useState({ ...initForm, site_id: autoSiteId, messageCandidature: initForm.messageCandidature || "" });
  const [step,    setStep]    = useState(0);
  const [saveErr, setSaveErr] = useState("");
  const [saving,  setSaving]  = useState(false);

  // ── État validation N° Sécu ───────────────────────────────────────────────
  // null | { status: 'checking'|'active'|'inactive', dupe? }
  const [secuStatus,     setSecuStatus]     = useState(null);
  const [secuLoading,    setSecuLoading]    = useState(false);
  const [showRecupModal, setShowRecupModal] = useState(false);
  const [recupLoading,   setRecupLoading]   = useState(false);
  // Pré-remplissage : source (pour la bannière) + clés récupérées (pour le highlight)
  const [prefillSource,  setPrefillSource]  = useState(null); // { prenom, nom, dateEntree, dateSortie, isCandidat }
  const [prefilledKeys,  setPrefilledKeys]  = useState(new Set());

  const upd  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updF = (t, f, v) => setForm(fm => ({ ...fm, [t]: { ...fm[t], [f]: v } }));
  const hl   = (k) => prefilledKeys.has(k); // highlight prop helper

  // ── Étapes selon type ─────────────────────────────────────────────────────
  const STEPS = form.isCandidat
    ? ["Identité & candidature", "Résumé"]
    : ["Identité & parcours", "Situation", "Formation & mobilité", "Freins & projet", "Résumé"];

  // ── Validation ────────────────────────────────────────────────────────────
  const okCandidat = !!(form.nom && form.prenom && form.numSecuSociale && form.sexe
    && form.dateNaissance && form.candidatureRecueLe && form.site_id);
  const okSal = !!(form.nom && form.prenom && form.telephone && form.numSecuSociale &&
    form.dateEntree && form.dateFinContrat && form.dateFinAgrement && form.site_id);
  const ok = form.isCandidat ? okCandidat : okSal;
  const secuBlocked = secuStatus?.status === "active"; // bloque la soumission

  // ── Vérification N° Sécu en temps réel (onBlur) ───────────────────────────
  const handleNumSecuBlur = useCallback(async () => {
    const val = form.numSecuSociale?.trim();
    if (!val || val.length < 10) { setSecuStatus(null); return; }
    setSecuLoading(true);
    setSecuStatus({ status: "checking" });
    try {
      const dupes = await checkNumSecuUnique(val, form.id || null);
      if (dupes.length === 0) {
        setSecuStatus(null);
        return;
      }
      const dupe = dupes[0];
      const isActive = !dupe.date_sortie; // salarié/candidat sans date de sortie = actif
      const status = isActive ? "active" : "inactive";
      setSecuStatus({ status, dupe });
      if (status === "inactive") setShowRecupModal(true);
    } catch {
      setSecuStatus(null);
    } finally {
      setSecuLoading(false);
    }
  }, [form.numSecuSociale, form.id]);

  // Réinitialiser le statut si l'utilisateur retape le numéro
  const handleNumSecuChange = (val) => {
    upd("numSecuSociale", val.trim());
    if (secuStatus) setSecuStatus(null);
    if (prefilledKeys.size > 0 && !prefillSource) setPrefilledKeys(new Set());
  };

  // ── Récupérer les données de l'ancien passage ──────────────────────────────
  const handleRecuperer = async () => {
    if (!secuStatus?.dupe?.id) return;
    setRecupLoading(true);
    try {
      const old = await getSalarieById(secuStatus.dupe.id);
      if (!old) return;

      // Champs à transférer (sauf ceux propres au nouveau passage)
      const updates = {};
      const filled = new Set();
      PREFILL_KEYS.forEach(k => {
        const v = old[k];
        const isEmpty = v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0) || (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);
        if (!isEmpty) {
          updates[k] = v;
          filled.add(k);
        }
      });

      setForm(f => ({
        ...f,
        ...updates,
        // Toujours garder le numéro sécu déjà saisi + le site courant
        numSecuSociale: f.numSecuSociale,
        site_id:        f.site_id,
        previousSalarieId: old.id,
      }));
      setPrefillSource({ prenom: old.prenom, nom: old.nom, dateEntree: old.dateEntree, dateSortie: old.dateSortie, isCandidat: old.isCandidat });
      setPrefilledKeys(filled);
      setShowRecupModal(false);
    } catch (e) {
      console.error("Récupération échouée :", e);
    } finally {
      setRecupLoading(false);
    }
  };

  // ── Enregistrement ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!ok || secuBlocked) return;
    setSaveErr("");
    setSaving(true);
    try {
      // Vérification finale doublon (au cas où l'onBlur n'aurait pas été déclenché)
      if (form.numSecuSociale) {
        const dupes = await checkNumSecuUnique(form.numSecuSociale, form.id || null);
        if (dupes.length > 0) {
          const d = dupes[0];
          if (!d.date_sortie) {
            const site = sites.find(s => s.id === d.site_id);
            const siteLabel = site ? [site.filiale, site.secteur, site.activite, site.nom].filter(Boolean).join(" › ") : "—";
            setSaveErr(`Un salarié actif avec ce numéro de sécurité sociale existe déjà : ${d.prenom} ${d.nom} (${d.is_candidat ? "Candidat" : "Salarié"} · ${siteLabel})`);
            return;
          }
        }
      }
      await onSave(form);
    } catch (e) {
      setSaveErr("Erreur lors de l'enregistrement : " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Modale récupération ancien passage */}
      {showRecupModal && secuStatus?.dupe && (
        <ModalRecuperer
          dupe={secuStatus.dupe}
          loading={recupLoading}
          onRecuperer={handleRecuperer}
          onIgnorer={() => setShowRecupModal(false)}
          onClose={() => { setShowRecupModal(false); setSecuStatus(null); }}
        />
      )}

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

          {/* ── Bannière pré-remplissage ── */}
          {prefillSource && (
            <div className="mx-5 mt-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <span className="text-xl shrink-0">↩</span>
              <div className="text-xs text-amber-800">
                <p className="font-semibold">Données récupérées depuis l'ancien dossier</p>
                <p className="text-amber-700 mt-0.5">
                  {prefillSource.prenom} {prefillSource.nom} ·{" "}
                  {prefillSource.isCandidat ? "Candidat(e)" : "Salarié(e)"} ·{" "}
                  passage du {fmt(prefillSource.dateEntree) || "—"}
                  {prefillSource.dateSortie ? ` au ${fmt(prefillSource.dateSortie)}` : ""}
                </p>
                <p className="text-amber-600 mt-0.5">Les champs marqués <strong>↩ récupéré</strong> sont pré-remplis — vérifiez-les avant de valider.</p>
              </div>
              <button onClick={() => { setPrefillSource(null); setPrefilledKeys(new Set()); }}
                className="ml-auto text-amber-400 hover:text-amber-600 shrink-0 text-lg">×</button>
            </div>
          )}

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

            {/* ═══ CANDIDAT — Étape 0 : Identité & candidature ════════════════ */}
            {form.isCandidat && step === 0 && (
              <div className="space-y-6">

                {/* État civil obligatoire */}
                <div>
                  <SectionTitle>État civil *</SectionTitle>
                  <div className="grid grid-cols-2 gap-4">
                    <FInput label="NOM *" required highlight={hl("nom")} value={form.nom}
                      onChange={e => upd("nom", e.target.value.toUpperCase())} />
                    <FInput label="Prénom *" required highlight={hl("prenom")} value={form.prenom}
                      onChange={e => upd("prenom", e.target.value)} />
                    <FSelect label="Sexe *" required highlight={hl("sexe")} value={form.sexe}
                      onChange={e => upd("sexe", e.target.value)}>
                      <option value="">—</option><option>F</option><option>M</option>
                    </FSelect>
                    <FInput label="Date de naissance *" type="date" required highlight={hl("dateNaissance")}
                      value={form.dateNaissance}
                      onChange={e => upd("dateNaissance", e.target.value)} />
                    <div className="col-span-2">
                      <FInput label="N° Sécurité sociale *" required
                        value={form.numSecuSociale}
                        onChange={e => handleNumSecuChange(e.target.value)}
                        onBlur={handleNumSecuBlur}
                        placeholder="1 84 12 75 108 042 68"
                      />
                      {/* Statut du contrôle N° sécu */}
                      {secuLoading && (
                        <p className="mt-1 text-xs text-gray-400 flex items-center gap-1.5">
                          <span className="w-3 h-3 border-2 border-gray-300 border-t-indigo-400 rounded-full animate-spin inline-block" />
                          Vérification en cours…
                        </p>
                      )}
                      {secuStatus?.status === "active" && (
                        <p className="mt-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                          🚫 <strong>Un salarié actif avec ce numéro de sécurité sociale existe déjà</strong>
                          {" "}— {secuStatus.dupe.prenom} {secuStatus.dupe.nom}
                        </p>
                      )}
                      {saveErr && (
                        <p className="mt-1 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{saveErr}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <FInput label="Candidature reçue le *" required type="date"
                        value={form.candidatureRecueLe}
                        onChange={e => upd("candidatureRecueLe", e.target.value)} />
                    </div>

                    {accessibleSites.length > 1 && (
                      <div className="col-span-2">
                        <FSelect label="Filiale / Activité *" required value={form.site_id || ""}
                          onChange={e => upd("site_id", e.target.value)}>
                          <option value="">— Sélectionner une activité —</option>
                          <SiteOptions sites={accessibleSites} />
                        </FSelect>
                      </div>
                    )}
                  </div>
                </div>

                {/* Coordonnées optionnelles */}
                <div>
                  <SectionTitle>Coordonnées</SectionTitle>
                  <div className="grid grid-cols-2 gap-4">
                    <FInput label="Téléphone" highlight={hl("telephone")} value={form.telephone}
                      onChange={e => upd("telephone", e.target.value)} />
                    <FInput label="Mail" highlight={hl("mail")} value={form.mail}
                      onChange={e => upd("mail", e.target.value)} />
                  </div>
                </div>

                {/* Publics prioritaires */}
                <div>
                  <SectionTitle>Publics prioritaires</SectionTitle>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <FCheck label="DELD"         highlight={hl("deld")}        checked={form.deld}        onChange={e => upd("deld",        e.target.checked)} />
                    <FCheck label="TH"           highlight={hl("th")}          checked={form.th}          onChange={e => upd("th",          e.target.checked)} />
                    <FCheck label="RQTH"         highlight={hl("rqth")}        checked={form.rqth}        onChange={e => upd("rqth",        e.target.checked)} />
                    <FCheck label="Résident QPV" highlight={hl("residentQPV")} checked={form.residentQPV} onChange={e => upd("residentQPV", e.target.checked)} />
                  </div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Allocation / Ressources <span className="text-gray-400">(un seul choix)</span></p>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { key: "brsa", label: "BRSA" },
                      { key: "ass",  label: "ASS"  },
                      { key: "sansRessources", label: "Sans ressources" },
                    ].map(({ key, label }) => (
                      <button key={key} type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          brsa:           key === "brsa"           ? !f.brsa           : false,
                          ass:            key === "ass"            ? !f.ass            : false,
                          sansRessources: key === "sansRessources" ? !f.sansRessources : false,
                        }))}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                          form[key]
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : hl(key)
                              ? "bg-amber-50 text-amber-700 border-amber-300"
                              : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                        }`}>{label}{hl(key) && !form[key] ? "" : ""}</button>
                    ))}
                  </div>
                </div>

                {/* Accompagnement */}
                <div>
                  <SectionTitle>Accompagnement</SectionTitle>
                  <div className="grid grid-cols-2 gap-4">
                    <FSelect label="Prescripteur" highlight={hl("prescripteur")} value={form.prescripteur}
                      onChange={e => upd("prescripteur", e.target.value)}>
                      <option value="">—</option>
                      {PRESCRIPTEURS.map(p => <option key={p}>{p}</option>)}
                    </FSelect>
                    <FInput label="Référent prescripteur" highlight={hl("nomPrenomPrescripteur")}
                      value={form.nomPrenomPrescripteur}
                      onChange={e => upd("nomPrenomPrescripteur", e.target.value)}
                      placeholder="Prénom NOM, organisme" />
                    <div className="col-span-2">
                      <FInput label="Autre accompagnateur" highlight={hl("autreAccompagnateur")}
                        value={form.autreAccompagnateur}
                        onChange={e => upd("autreAccompagnateur", e.target.value)}
                        placeholder="CIP, AS, ML, autre organisme…" />
                    </div>
                  </div>
                </div>

                {/* Message de candidature */}
                <div>
                  <SectionTitle>Message de candidature</SectionTitle>
                  <FTextarea
                    label="Message / informations transmises"
                    value={form.messageCandidature}
                    onChange={e => upd("messageCandidature", e.target.value)}
                    rows={3}
                    placeholder="Motivations, disponibilités, informations transmises par le candidat ou le prescripteur…"
                  />
                </div>

              </div>
            )}

            {/* ═══ CANDIDAT — Étape 1 : Résumé ════════════════════════════════ */}
            {form.isCandidat && step === 1 && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <h3 className="font-semibold text-purple-900 mb-3">Récapitulatif candidature</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Nom :</span> <strong>{form.nom} {form.prenom}</strong></div>
                    <div><span className="text-gray-500">Né(e) le :</span> {fmt(form.dateNaissance) || "—"}</div>
                    <div><span className="text-gray-500">Sexe :</span> {form.sexe || "—"}</div>
                    <div><span className="text-gray-500">N° SS :</span> {form.numSecuSociale || "—"}</div>
                    <div><span className="text-gray-500">Candidature :</span> {fmt(form.candidatureRecueLe) || "—"}</div>
                    <div><span className="text-gray-500">Tél :</span> {form.telephone || "—"}</div>
                    <div><span className="text-gray-500">Mail :</span> {form.mail || "—"}</div>
                    <div><span className="text-gray-500">Prescripteur :</span> {form.prescripteur || "—"}</div>
                    {form.site_id && (() => {
                      const s = sites.find(x => x.id === form.site_id);
                      return s ? <div className="col-span-2"><span className="text-gray-500">Activité :</span> {[s.filiale, s.secteur !== s.activite ? s.activite : null, s.nom].filter(Boolean).join(" › ")}</div> : null;
                    })()}
                    {form.nomPrenomPrescripteur && (
                      <div className="col-span-2"><span className="text-gray-500">Référent :</span> {form.nomPrenomPrescripteur}</div>
                    )}
                    {form.autreAccompagnateur && (
                      <div className="col-span-2"><span className="text-gray-500">Accompagnateur :</span> {form.autreAccompagnateur}</div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {form.deld && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">DELD</span>}
                    {form.brsa && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">BRSA</span>}
                    {form.th   && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">TH</span>}
                    {form.rqth && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">RQTH</span>}
                    {form.ass  && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">ASS</span>}
                    {form.sansRessources && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Sans ressources</span>}
                    {form.residentQPV   && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">QPV</span>}
                  </div>
                  {form.messageCandidature && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Message de candidature</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{form.messageCandidature}</p>
                    </div>
                  )}
                  {prefillSource && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                      ↩ Données issues du passage de {prefillSource.prenom} {prefillSource.nom} ({fmt(prefillSource.dateEntree)} → {fmt(prefillSource.dateSortie) || "en cours"})
                    </div>
                  )}
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
                  ℹ️ Les informations complémentaires (entretien, aptitudes, projet, freins…) seront renseignées lors des entretiens de suivi.
                </div>
                {!ok && <p className="text-sm text-orange-600 bg-orange-50 rounded-xl px-4 py-3">⚠ Champs obligatoires manquants (marqués *).</p>}
                {secuBlocked && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">🚫 Un salarié actif avec ce numéro de sécurité sociale existe déjà.</p>}
                {saveErr && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{saveErr}</p>}
              </div>
            )}

            {/* ═══ SALARIÉ — Étape 0 : Identité & parcours ════════════════════ */}
            {!form.isCandidat && step === 0 && (
              <div className="grid grid-cols-2 gap-4">
                <FSec>État civil</FSec>
                <FInput label="NOM *" required highlight={hl("nom")} value={form.nom} onChange={e => upd("nom", e.target.value.toUpperCase())} />
                <FInput label="Prénom *" required highlight={hl("prenom")} value={form.prenom} onChange={e => upd("prenom", e.target.value)} />
                <FInput label="Téléphone *" required highlight={hl("telephone")} value={form.telephone} onChange={e => upd("telephone", e.target.value)} />
                <FInput label="Mail" highlight={hl("mail")} value={form.mail} onChange={e => upd("mail", e.target.value)} />
                <FInput label="Date de naissance" type="date" highlight={hl("dateNaissance")} value={form.dateNaissance} onChange={e => upd("dateNaissance", e.target.value)} />
                <FSelect label="Sexe" highlight={hl("sexe")} value={form.sexe} onChange={e => upd("sexe", e.target.value)}>
                  <option value="">—</option><option>F</option><option>M</option>
                </FSelect>

                <div className="col-span-2">
                  <FInput label="N° Sécurité sociale *" required
                    value={form.numSecuSociale}
                    onChange={e => handleNumSecuChange(e.target.value)}
                    onBlur={handleNumSecuBlur}
                    placeholder="1 84 12 75 108 042 68"
                  />
                  {secuLoading && (
                    <p className="mt-1 text-xs text-gray-400 flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-gray-300 border-t-indigo-400 rounded-full animate-spin inline-block" />
                      Vérification en cours…
                    </p>
                  )}
                  {secuStatus?.status === "active" && (
                    <p className="mt-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                      🚫 <strong>Un salarié actif avec ce numéro de sécurité sociale existe déjà</strong>
                      {" "}— {secuStatus.dupe.prenom} {secuStatus.dupe.nom}
                    </p>
                  )}
                  {saveErr && (
                    <p className="mt-1 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{saveErr}</p>
                  )}
                </div>

                <FSec>Parcours</FSec>
                <FInput label="Date d'entrée *" required type="date" value={form.dateEntree} onChange={e => upd("dateEntree", e.target.value)} />
                <FInput label="Fin de contrat *" required type="date" value={form.dateFinContrat} onChange={e => upd("dateFinContrat", e.target.value)} />
                <FInput label="Fin d'agrément *" required type="date" value={form.dateFinAgrement} onChange={e => upd("dateFinAgrement", e.target.value)} />
                <FSelect label="Prescripteur" highlight={hl("prescripteur")} value={form.prescripteur} onChange={e => upd("prescripteur", e.target.value)}>
                  {PRESCRIPTEURS.map(p => <option key={p}>{p}</option>)}
                </FSelect>
                <FInput label="Référent prescripteur" highlight={hl("nomPrenomPrescripteur")} value={form.nomPrenomPrescripteur} onChange={e => upd("nomPrenomPrescripteur", e.target.value)} />
                <FSelect label={`Site *${accessibleSites.length <= 1 ? " (auto)" : ""}`}
                  required value={form.site_id || ""}
                  onChange={e => upd("site_id", e.target.value)}
                  disabled={accessibleSites.length === 1}>
                  <option value="">— Sélectionner un site —</option>
                  <SiteOptions sites={accessibleSites} />
                </FSelect>

                <FSec>Publics prioritaires</FSec>
                <div className="col-span-2 grid grid-cols-2 gap-3">
                  <FCheck label="DELD"         highlight={hl("deld")}        checked={form.deld}        onChange={e => upd("deld",        e.target.checked)} />
                  <FCheck label="TH"           highlight={hl("th")}          checked={form.th}          onChange={e => upd("th",          e.target.checked)} />
                  <FCheck label="RQTH"         highlight={hl("rqth")}        checked={form.rqth}        onChange={e => upd("rqth",        e.target.checked)} />
                  <FCheck label="Résident QPV" highlight={hl("residentQPV")} checked={form.residentQPV} onChange={e => upd("residentQPV", e.target.checked)} />
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-gray-600 mb-2">Allocation / Ressources <span className="text-gray-400">(un seul choix)</span></p>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { key: "brsa", label: "BRSA" },
                      { key: "ass",  label: "ASS"  },
                      { key: "sansRessources", label: "Sans ressources" },
                    ].map(({ key, label }) => (
                      <button key={key} type="button"
                        onClick={() => setForm(f => ({ ...f, brsa: key==="brsa"?!f.brsa:false, ass: key==="ass"?!f.ass:false, sansRessources: key==="sansRessources"?!f.sansRessources:false }))}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                          form[key] ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                        }`}>{label}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SALARIÉ — Étape 1 : Situation ══════════════════════════════ */}
            {!form.isCandidat && step === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <FSec>Situation familiale</FSec>
                <FSelect label="Situation maritale" highlight={hl("situationMaritale")} value={form.situationMaritale} onChange={e => upd("situationMaritale", e.target.value)}>
                  <option value="">—</option>
                  {["Célibataire","En couple","Marié(e)","Divorcé(e)","Veuf/veuve"].map(v => <option key={v}>{v}</option>)}
                </FSelect>
                <FInput label="Nb enfants" type="number" min="0" highlight={hl("nbEnfants")} value={form.nbEnfants} onChange={e => upd("nbEnfants", +e.target.value)} />
                <FSec>Logement &amp; Santé</FSec>
                <FSelect label="Hébergement" highlight={hl("hebergement")} value={form.hebergement} onChange={e => upd("hebergement", e.target.value)}>
                  <option value="">—</option>
                  {["Locataire","Propriétaire","Hébergé (famille)","Hébergé (tiers)","CHRS","SDF","Autre"].map(v => <option key={v}>{v}</option>)}
                </FSelect>
                <div>
                  <FCheck label="CSS / Mutuelle" highlight={hl("css")} checked={form.css} onChange={e => upd("css", e.target.checked)} />
                  {form.css && <div className="mt-2"><FInput label="Jusqu'au" type="date" highlight={hl("cssJusquau")} value={form.cssJusquau} onChange={e => upd("cssJusquau", e.target.value)} /></div>}
                </div>
                <FSec>Ressources</FSec>
                <FInput label="Revenus (€/mois)" type="number" highlight={hl("revenus")} value={form.revenus} onChange={e => upd("revenus", +e.target.value)} />
                <FInput label="Charges (€/mois)" type="number" highlight={hl("charges")} value={form.charges} onChange={e => upd("charges", +e.target.value)} />
              </div>
            )}

            {/* ═══ SALARIÉ — Étape 2 : Formation & mobilité ═══════════════════ */}
            {!form.isCandidat && step === 2 && (
              <div className="grid grid-cols-2 gap-4">
                <FSec>Formation</FSec>
                <FSelect label="Niveau de formation" highlight={hl("niveauFormation")} value={form.niveauFormation} onChange={e => upd("niveauFormation", e.target.value)}>
                  {NIVEAUX.map(n => <option key={n}>{n}</option>)}
                </FSelect>
                <FSelect label="Niveau de langue" highlight={hl("niveauLangue")} value={form.niveauLangue} onChange={e => upd("niveauLangue", e.target.value)}>
                  {NIVEAUX_LANGUE.map(n => <option key={n}>{n}</option>)}
                </FSelect>
                <div className="col-span-2 flex gap-6">
                  <FCheck label="Lecture"  highlight={hl("lecture")}  checked={form.lecture}  onChange={e => upd("lecture",  e.target.checked)} />
                  <FCheck label="Écriture" highlight={hl("ecriture")} checked={form.ecriture} onChange={e => upd("ecriture", e.target.checked)} />
                  <FCheck label="Calcul"   highlight={hl("calcul")}   checked={form.calcul}   onChange={e => upd("calcul",   e.target.checked)} />
                </div>
                <FInput label="Diplômes" highlight={hl("diplomes")} value={form.diplomes} onChange={e => upd("diplomes", e.target.value)} />
                <div><FCheck label="CV disponible" highlight={hl("cv")} checked={form.cv} onChange={e => upd("cv", e.target.checked)} /></div>
                <FSec>Mobilité</FSec>
                <div className="col-span-2 flex gap-6">
                  <FCheck label="Permis B"           highlight={hl("permisB")}  checked={form.permisB}  onChange={e => upd("permisB",  e.target.checked)} />
                  <FCheck label="Véhicule personnel" highlight={hl("vehicule")} checked={form.vehicule} onChange={e => upd("vehicule", e.target.checked)} />
                </div>
                <FSelect label="Moyen de transport" highlight={hl("moyenTransport")} value={form.moyenTransport} onChange={e => upd("moyenTransport", e.target.value)}>
                  <option value="">—</option>
                  {MOYENS_TRANSPORT.map(m => <option key={m}>{m}</option>)}
                </FSelect>
                <FInput label="Zone de déplacement" highlight={hl("deplacements")} value={form.deplacements} onChange={e => upd("deplacements", e.target.value)} />
              </div>
            )}

            {/* ═══ SALARIÉ — Étape 3 : Freins & projet ════════════════════════ */}
            {!form.isCandidat && step === 3 && (
              <div className="grid grid-cols-2 gap-4">
                <FSec>Freins à l&apos;entrée</FSec>
                {hl("freinsEntree") && (
                  <div className="col-span-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    ↩ Freins récupérés depuis l'ancien passage — vérifiez et mettez à jour si nécessaire.
                  </div>
                )}
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
                  <FInput label="Projet professionnel" highlight={hl("projetPro")} value={form.projetPro} onChange={e => upd("projetPro", e.target.value)} />
                </div>
                {[0, 1, 2].map(i => (
                  <FSelect key={i} label={`Domaine ${i + 1}`} highlight={hl("domainesPro")} value={form.domainesPro[i] || ""} onChange={e => { const d = [...form.domainesPro]; d[i] = e.target.value; upd("domainesPro", d); }}>
                    <option value="">—</option>
                    {DOMAINES_PRO.map(d => <option key={d}>{d}</option>)}
                  </FSelect>
                ))}
                <div className="col-span-2">
                  <FInput label="Préconisation" highlight={hl("preconisation")} value={form.preconisation} onChange={e => upd("preconisation", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <FTextarea label="Synthèse des besoins à l'entrée" highlight={hl("synthBesoinsEntree")} value={form.synthBesoinsEntree} onChange={e => upd("synthBesoinsEntree", e.target.value)} />
                </div>
              </div>
            )}

            {/* ═══ SALARIÉ — Étape 4 : Résumé salarié ═════════════════════════ */}
            {!form.isCandidat && step === 4 && (
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
                    {form.rqth && <span className="text-xs bg-blue-200  text-blue-800  px-2 py-0.5 rounded-full">RQTH</span>}
                  </div>
                  {prefillSource && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                      ↩ Données issues du passage de {prefillSource.prenom} {prefillSource.nom} ({fmt(prefillSource.dateEntree)} → {fmt(prefillSource.dateSortie) || "en cours"})
                    </div>
                  )}
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
                {secuBlocked && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">🚫 Un salarié actif avec ce numéro de sécurité sociale existe déjà.</p>}
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
            <div className="flex gap-2">
              {step < STEPS.length - 1
                ? <button onClick={() => setStep(s => s + 1)} className="px-5 py-2 rounded-xl text-sm bg-indigo-600 text-white font-medium">Suivant →</button>
                : <button
                    onClick={handleSubmit}
                    disabled={!ok || saving || secuBlocked}
                    className="px-5 py-2 rounded-xl text-sm bg-green-600 text-white font-medium disabled:opacity-40 flex items-center gap-2"
                  >
                    {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    ✓ Enregistrer
                  </button>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
