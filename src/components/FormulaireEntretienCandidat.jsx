import { useState } from "react";
import { todayStr } from "../lib/utils";
import { PRESCRIPTEURS, NIVEAUX_LANGUE, FREINS, FREINS_E } from "../lib/constants";
import { fC } from "../lib/theme";
import { FInput, FSelect, FTextarea } from "./ui";

// ─── Options ──────────────────────────────────────────────────────────────────
const IMPRESSIONS = [
  { v: "tres_bien", l: "Très bien — motivation claire, projet cohérent",   bg: "bg-green-100 text-green-800 border-green-300",   dot: "bg-green-500"  },
  { v: "bien",      l: "Bien — bon profil, quelques points à consolider",  bg: "bg-blue-100  text-blue-800  border-blue-300",    dot: "bg-blue-500"   },
  { v: "doute",     l: "Doute — réserve(s) identifiée(s)",                 bg: "bg-orange-100 text-orange-800 border-orange-300", dot: "bg-orange-400" },
  { v: "decliner",  l: "À décliner — candidature non retenue",             bg: "bg-red-100   text-red-800   border-red-300",     dot: "bg-red-500"    },
];
const ORIENTATIONS = [
  { v: "evaluation", l: "Évaluation en cours", bg: "bg-orange-100 text-orange-800 border-orange-300", dot: "bg-orange-400" },
  { v: "recrute",    l: "Recruter",            bg: "bg-green-100 text-green-800 border-green-300",   dot: "bg-green-500"  },
  { v: "vivier",     l: "Vivier",              bg: "bg-blue-100  text-blue-800  border-blue-300",    dot: "bg-blue-500"   },
  { v: "decliner",   l: "Décliner",            bg: "bg-red-100   text-red-800   border-red-300",     dot: "bg-red-500"    },
];
const RECHERCHE_OPTIONS = ["Moins de 6 mois","6 à 12 mois","1 à 2 ans","2 à 5 ans","Plus de 5 ans"];
const PIECE_OPTIONS = [
  { v: "cni",       l: "Carte nationale d'identité" },
  { v: "passeport", l: "Passeport UE"               },
  { v: "titre",     l: "Titre de séjour"            },
];
const STEPS = ["Entretien", "Identification", "Aptitude & Poste", "Projet & Motivation", "Freins", "Présentation EI", "Conclusion"];

// ─── Composants UI locaux ─────────────────────────────────────────────────────
function RadioChips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
            value === o.v
              ? o.bg + " shadow-sm ring-1 ring-inset ring-current/30"
              : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
          }`}>
          <span className={`w-2 h-2 rounded-full ${value === o.v ? o.dot : "bg-gray-300"}`} />
          {o.l}
        </button>
      ))}
    </div>
  );
}

function TroisBoutons({ options, value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(o => (
        <button key={o.v} type="button" onClick={() => onChange(value === o.v ? "" : o.v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
            value === o.v ? o.bg : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
          }`}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

function StepLabel({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 mb-2">{children}</p>;
}

// ─── Sélecteur multi-utilisateurs ─────────────────────────────────────────────
function UserMultiSelect({ users, value = [], onChange }) {
  const byRole = users.reduce((acc, u) => {
    const r = u.role === "admin" || u.role === "direction" ? "Direction" : "CIP";
    (acc[r] = acc[r] || []).push(u);
    return acc;
  }, {});
  return (
    <div className="space-y-3">
      {Object.entries(byRole).map(([role, list]) => (
        <div key={role}>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5">{role}</p>
          <div className="flex flex-wrap gap-2">
            {list.map(u => {
              const sel = value.includes(u.id);
              return (
                <button key={u.id} type="button"
                  onClick={() => onChange(sel ? value.filter(id => id !== u.id) : [...value, u.id])}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                    sel ? "bg-indigo-100 text-indigo-800 border-indigo-300 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
                  }`}>
                  <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${sel ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {u.prenom[0]}{u.nom[0]}
                  </span>
                  {u.prenom} {u.nom}
                  {sel && <span className="text-indigo-400 text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sélecteur multi-sites ────────────────────────────────────────────────────
function SiteMultiSelector({ sites, value = [], onChange }) {
  const filialesList = [...new Set(sites.map(s => s.filiale).filter(Boolean))];
  const [openFil, setOpenFil] = useState(null);
  const toggle = (siteId) => onChange(value.includes(siteId) ? value.filter(id => id !== siteId) : [...value, siteId]);
  return (
    <div className="space-y-2">
      {filialesList.map(fil => {
        const filSites = sites.filter(s => s.filiale === fil);
        const isOpen   = openFil === fil;
        const selCount = filSites.filter(s => value.includes(s.id)).length;
        return (
          <div key={fil} className="border border-gray-200 rounded-xl overflow-hidden">
            <button type="button" onClick={() => setOpenFil(isOpen ? null : fil)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700">
              {fil}
              <span className="flex items-center gap-2">
                {selCount > 0 && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{selCount} sélectionné{selCount > 1 ? "s" : ""}</span>}
                <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
              </span>
            </button>
            {isOpen && (
              <div className="p-2 space-y-1">
                {filSites.map(s => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-gray-50">
                    <input type="checkbox" checked={value.includes(s.id)} onChange={() => toggle(s.id)} className="rounded accent-indigo-600" />
                    <span className="text-xs text-gray-700">{s.nom}{s.ville ? ` — ${s.ville}` : ""}</span>
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
                <button type="button" onClick={() => toggle(id)} className="text-indigo-400 hover:text-red-500 ml-0.5">×</button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function FormulaireEntretienCandidat({
  salarie, sites = [], users = [],
  onSaveEntretien, onSaveCandidat, onClose
}) {
  const [typeChoice, setTypeChoice] = useState(null);
  const [step,       setStep]       = useState(0);
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState("");

  const [form, setForm] = useState({
    // ── 0. Info entretien
    date:         todayStr,
    assignedTo:   salarie.cip_id || (users[0]?.id ?? ""),
    avecQui:      [],
    ou:           "",

    // ── 1. Identification
    prescripteur:        salarie.prescripteur        || "",
    autreAccompagnateur: salarie.autreAccompagnateur || "",
    enRecherchDepuis:    salarie.enRecherchDepuis    || "",
    pieceIdentite:       salarie.pieceIdentite       || "",
    titreSejourValidite: salarie.titreSejourValidite || "",
    documentScanne:      "",   // "oui" | "non"

    // ── 2. Aptitude & Poste
    niveauLangue:          salarie.niveauLangue       || "",
    contraintePhysique:    salarie.contraintePhysique || "",   // observations aptitude
    contrainteSignalee:    "",   // "aucune" | "oui"
    visiteDuPoste:         "",   // retenu / apprécié ou non
    connaitSalarie:        null, // null | true | false
    connaitSalarieLequel:  "",
    // Horaires
    horaireCapable:  "",         // "oui" | "reserve" | "non"
    horaireMotif:    "",

    // ── 3. Projet & Motivation
    projetPro:            salarie.projetPro || "",
    accompagnementEnCours: "",   // sur quoi travaille-t-il dans son accompagnement ?
    parcoursResume:       "",    // résumé du parcours

    // ── 4. Freins
    freinsEntree: { ...(salarie.freinsEntree || {}) },

    // ── 5. Présentation EI
    presentationFaite:     false,
    adhesionEI:            "",
    adhesionEICommentaire: "",

    // ── 6. Conclusion
    impression:         salarie.impressionGlobale   || "",
    orientationMotif:   salarie.orientationMotif    || "",
    orientation:        salarie.orientationCandidat || "",
    orientationSiteIds: salarie.orientationSiteIds  ?? [],
    commentaireFinal:   "",
  });

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canNext = step === 0 ? (form.date && form.avecQui.length > 0) : true;

  // ── Enregistrement ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.date || form.avecQui.length === 0) return;
    setSaving(true);
    setErr("");
    try {
      const participantNames = form.avecQui
        .map(id => { const u = users.find(x => x.id === id); return u ? `${u.prenom} ${u.nom}` : id; })
        .join(", ");

      const typeLabel = typeChoice === "tel" ? "Entretien téléphonique" : "Entretien physique";

      // Construction du compte-rendu structuré dans "sujets"
      const lignes = [];
      if (typeChoice === "phys" && form.ou)         lignes.push(`Lieu : ${form.ou}`);
      if (form.visiteDuPoste)                       lignes.push(`Visite du poste : ${form.visiteDuPoste}`);
      if (form.connaitSalarie !== null)             lignes.push(`Connaît un salarié : ${form.connaitSalarie ? `Oui — ${form.connaitSalarieLequel}` : "Non"}`);
      if (form.accompagnementEnCours)               lignes.push(`Accompagnement en cours : ${form.accompagnementEnCours}`);
      if (form.parcoursResume)                      lignes.push(`Parcours : ${form.parcoursResume}`);
      if (form.horaireCapable)                      lignes.push(`Horaires : ${form.horaireCapable === "oui" ? "OK" : form.horaireCapable === "reserve" ? `Réserve — ${form.horaireMotif}` : `Non — ${form.horaireMotif}`}`);

      await onSaveEntretien({
        id:           null,
        salarie_id:   salarie.id,
        cip_id:       form.assignedTo,
        assignedTo:   form.assignedTo,
        date:         form.date,
        type:         typeLabel,
        sujets:       lignes.join(" · "),
        synthese:     form.commentaireFinal,
        participants: participantNames,
        jalon:        false,
        objectifs:    [],
      });

      // Mise à jour des champs candidat
      await onSaveCandidat({
        prescripteur:        form.prescripteur        || salarie.prescripteur,
        autreAccompagnateur: form.autreAccompagnateur || salarie.autreAccompagnateur,
        enRecherchDepuis:    form.enRecherchDepuis    || salarie.enRecherchDepuis,
        pieceIdentite:       form.pieceIdentite       || salarie.pieceIdentite,
        titreSejourValidite: form.titreSejourValidite || salarie.titreSejourValidite,
        niveauLangue:        form.niveauLangue        || salarie.niveauLangue,
        contraintePhysique:  form.contraintePhysique  || salarie.contraintePhysique,
        contrainteHoraire:   form.horaireCapable === "oui" ? "Aucune contrainte" : form.horaireMotif || salarie.contrainteHoraire,
        projetPro:           form.projetPro           || salarie.projetPro,
        freinsEntree:        form.freinsEntree,
        vuEntretienLe:       form.date,
        impressionGlobale:   form.impression          || salarie.impressionGlobale,
        impressionDetail:    form.commentaireFinal    || salarie.impressionDetail,
        orientationCandidat: form.orientation         || salarie.orientationCandidat,
        orientationMotif:    form.orientationMotif    || salarie.orientationMotif,
        orientationSiteIds:  form.orientationSiteIds.length > 0 ? form.orientationSiteIds : (salarie.orientationSiteIds ?? []),
      });

      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Écran : choix du type ─────────────────────────────────────────────────
  if (!typeChoice) {
    return (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:100, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"2rem", overflowY:"auto" }}>
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl mb-8">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-gray-900">Entretien candidat</h2>
              <p className="text-sm text-gray-400">{salarie.nom} {salarie.prenom}</p>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Type d'entretien</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setTypeChoice("tel")}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
                <span className="text-3xl">📞</span>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700">Téléphonique</p>
                  <p className="text-xs text-gray-400 mt-0.5">Appel téléphonique</p>
                </div>
              </button>
              <button type="button" onClick={() => setTypeChoice("phys")}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
                <span className="text-3xl">🤝</span>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700">Physique</p>
                  <p className="text-xs text-gray-400 mt-0.5">Entretien en présence</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulaire multi-étapes ───────────────────────────────────────────────
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:100, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"2rem", overflowY:"auto" }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl mb-8">

        {/* En-tête */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">
              {typeChoice === "tel" ? "📞 Entretien téléphonique" : "🤝 Entretien physique"}
            </h2>
            <p className="text-sm text-gray-400">{salarie.nom} {salarie.prenom}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setTypeChoice(null); setStep(0); }} className="text-xs text-gray-400 hover:text-indigo-600">← Changer</button>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="px-5 pt-4">
          <div className="flex gap-1 mb-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-indigo-500" : "bg-gray-100"}`} />
            ))}
          </div>
          <div className="flex justify-between">
            <p className="text-xs text-gray-400 font-medium">{step + 1}. {STEPS[step]}</p>
            <p className="text-xs text-gray-400">{step + 1} / {STEPS.length}</p>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-5 space-y-4 max-h-[62vh] overflow-y-auto">

          {/* ══ 0 — Info entretien ══ */}
          {step === 0 && (
            <div className="space-y-5">
              <StepLabel icon="📅" title="Informations de l'entretien" />
              <div className="grid grid-cols-2 gap-4">
                <FInput label="Date *" type="date" value={form.date} onChange={e => upd("date", e.target.value)} />
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Réalisé par</label>
                  <select value={form.assignedTo} onChange={e => upd("assignedTo", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200">
                    {users.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
                  </select>
                </div>
              </div>
              {typeChoice === "phys" && (
                <FInput label="Lieu" value={form.ou} onChange={e => upd("ou", e.target.value)} placeholder="Ex : Bureau CIP, Firminy" />
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                  Participants à l'entretien *
                  <span className="text-gray-400 font-normal normal-case ml-1">— sélectionner toutes les personnes présentes</span>
                </label>
                {users.length > 0
                  ? <UserMultiSelect users={users} value={form.avecQui} onChange={v => upd("avecQui", v)} />
                  : <p className="text-xs text-gray-400 italic">Aucun utilisateur disponible</p>
                }
                {form.avecQui.length === 0 && (
                  <p className="text-xs text-orange-500 mt-1">Sélectionnez au moins un participant.</p>
                )}
              </div>
            </div>
          )}

          {/* ══ 1 — Identification ══ */}
          {step === 1 && (
            <div className="space-y-4">
              <StepLabel icon="👤" title="Identification" subtitle="Informations d'accompagnement et pièce d'identité" />

              <div className="grid grid-cols-2 gap-4">
                <FSelect label="Prescripteur" value={form.prescripteur} onChange={e => upd("prescripteur", e.target.value)}>
                  <option value="">—</option>
                  {PRESCRIPTEURS.map(p => <option key={p}>{p}</option>)}
                </FSelect>
                <FInput label="Autre accompagnateur" value={form.autreAccompagnateur}
                  onChange={e => upd("autreAccompagnateur", e.target.value)}
                  placeholder="Nom, organisme (CIP, FT, AS, ML…)" />
              </div>

              <FSelect label="En recherche active depuis" value={form.enRecherchDepuis} onChange={e => upd("enRecherchDepuis", e.target.value)}>
                <option value="">—</option>
                {RECHERCHE_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </FSelect>

              {/* Pièce d'identité ⚠ vérification obligatoire */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                  ⚠ Pièce d'identité — vérification obligatoire
                </p>
                <div className="flex flex-wrap gap-2">
                  {PIECE_OPTIONS.map(o => (
                    <button key={o.v} type="button"
                      onClick={() => upd("pieceIdentite", form.pieceIdentite === o.v ? "" : o.v)}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        form.pieceIdentite === o.v
                          ? "bg-amber-200 text-amber-900 border-amber-400"
                          : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
                      }`}>
                      {o.l}
                    </button>
                  ))}
                </div>

                {form.pieceIdentite === "titre" && (
                  <div className="space-y-3">
                    <p className="text-xs text-amber-700 italic">
                      Vérifier que la date de validité couvre au moins la durée du contrat proposé. Scanner le document.
                    </p>
                    <FInput label="Date de validité du titre de séjour"
                      type="date" value={form.titreSejourValidite}
                      onChange={e => upd("titreSejourValidite", e.target.value)} />
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Document scanné ?</label>
                      <div className="flex gap-2">
                        {[{v:"oui",l:"✓ Oui"},{v:"non",l:"✗ Non"}].map(o => (
                          <button key={o.v} type="button" onClick={() => upd("documentScanne", o.v)}
                            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                              form.documentScanne === o.v
                                ? (o.v === "oui" ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300")
                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                            }`}>{o.l}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ 2 — Aptitude & Poste ══ */}
          {step === 2 && (
            <div className="space-y-5">
              <StepLabel icon="💪" title="Aptitude & Poste" subtitle="Langue, aptitude physique, visite du poste, horaires" />

              {/* Niveau de français */}
              <div>
                <SectionTitle>3. Niveau de français</SectionTitle>
                <p className="text-xs text-gray-400 mb-2">Niveau minimum requis : A2. Niveau recommandé : B1.</p>
                <FSelect label="Niveau évalué" value={form.niveauLangue} onChange={e => upd("niveauLangue", e.target.value)}>
                  <option value="">—</option>
                  {NIVEAUX_LANGUE.map(n => <option key={n}>{n}</option>)}
                </FSelect>
              </div>

              {/* Aptitude physique */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <SectionTitle>4. Aptitude physique au poste</SectionTitle>
                <p className="text-xs text-gray-400 italic">
                  Le poste implique : station debout prolongée, posture statique, gestes répétitifs. Vérifier l'absence de contre-indication médicale connue.
                </p>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">
                    Le candidat signale-t-il une contrainte de santé ?
                  </label>
                  <TroisBoutons
                    options={[
                      { v: "aucune", l: "Aucune contrainte signalée", bg: "bg-green-100 text-green-800 border-green-300" },
                      { v: "oui",    l: "Contrainte identifiée",       bg: "bg-orange-100 text-orange-800 border-orange-300" },
                    ]}
                    value={form.contrainteSignalee}
                    onChange={v => upd("contrainteSignalee", v)}
                  />
                </div>
                {form.contrainteSignalee === "oui" && (
                  <FTextarea label="Précision / observations" value={form.contraintePhysique}
                    onChange={e => upd("contraintePhysique", e.target.value)}
                    rows={2} placeholder="Nature de la contrainte, posture, mobilité perçue…" />
                )}
                {form.contrainteSignalee === "aucune" && (
                  <FTextarea label="Observations (posture, mobilité perçue lors de l'entretien)"
                    value={form.contraintePhysique}
                    onChange={e => upd("contraintePhysique", e.target.value)}
                    rows={2} placeholder="Facultatif — impressions générales sur la mobilité…" />
                )}
              </div>

              {/* Retour visite du poste */}
              <div className="space-y-3">
                <SectionTitle>5. Retour sur la visite du poste</SectionTitle>
                <FTextarea label="Ce que le candidat a retenu / apprécié ou non"
                  value={form.visiteDuPoste}
                  onChange={e => upd("visiteDuPoste", e.target.value)}
                  rows={2} placeholder="Réactions du candidat pendant la visite…" />
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">
                    Connaît ou a connu un salarié de la structure ?
                  </label>
                  <div className="flex gap-2">
                    {[{v:true,l:"✓ Oui"},{v:false,l:"Non"}].map(o => (
                      <button key={String(o.v)} type="button"
                        onClick={() => upd("connaitSalarie", form.connaitSalarie === o.v ? null : o.v)}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                          form.connaitSalarie === o.v
                            ? (o.v ? "bg-indigo-100 text-indigo-800 border-indigo-300" : "bg-gray-100 text-gray-700 border-gray-300")
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}>{o.l}</button>
                    ))}
                  </div>
                  {form.connaitSalarie === true && (
                    <div className="mt-2">
                      <FInput label="Lequel ?" value={form.connaitSalarieLequel}
                        onChange={e => upd("connaitSalarieLequel", e.target.value)} placeholder="Nom du salarié…" />
                    </div>
                  )}
                </div>
              </div>

              {/* Horaires */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
                <SectionTitle>10. Présentation des horaires</SectionTitle>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white rounded-xl border border-blue-200 p-3">
                    <p className="font-bold text-blue-800 mb-1">🌅 Poste matin</p>
                    <p className="text-blue-700 font-semibold">6h00 – 13h30</p>
                    <p className="text-gray-500 mt-1">Semaine A : Lundi → Vendredi</p>
                    <p className="text-gray-500">Semaine B : Mardi → Samedi</p>
                  </div>
                  <div className="bg-white rounded-xl border border-blue-200 p-3">
                    <p className="font-bold text-blue-800 mb-1">🌆 Poste après-midi</p>
                    <p className="text-blue-700 font-semibold">13h30 – 21h00</p>
                    <p className="text-gray-500 mt-1">Alternance avec poste matin</p>
                    <p className="text-gray-500">Planning communiqué à l'avance</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">
                    Le candidat peut-il tenir ces horaires ?
                  </label>
                  <TroisBoutons
                    options={[
                      { v: "oui",     l: "✓ Oui, sans contrainte",  bg: "bg-green-100 text-green-800 border-green-300"   },
                      { v: "reserve", l: "◐ Oui, avec réserve",     bg: "bg-orange-100 text-orange-800 border-orange-300" },
                      { v: "non",     l: "✗ Non",                   bg: "bg-red-100 text-red-800 border-red-300"          },
                    ]}
                    value={form.horaireCapable}
                    onChange={v => upd("horaireCapable", v)}
                  />
                </div>
                {(form.horaireCapable === "reserve" || form.horaireCapable === "non") && (
                  <FInput label={form.horaireCapable === "reserve" ? "Préciser la réserve" : "Motif"}
                    value={form.horaireMotif}
                    onChange={e => upd("horaireMotif", e.target.value)}
                    placeholder="Ex : pas disponible le samedi, contrainte de garde…" />
                )}
              </div>
            </div>
          )}

          {/* ══ 3 — Projet & Motivation ══ */}
          {step === 3 && (
            <div className="space-y-5">
              <StepLabel icon="🎯" title="Projet & Motivation" subtitle="Projet professionnel, parcours et questions de motivation" />

              <SectionTitle>6. Projet professionnel & accompagnement</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <FInput label="Projet professionnel (court / moyen terme)"
                  value={form.projetPro}
                  onChange={e => upd("projetPro", e.target.value)}
                  placeholder="Ex : Agent de tri, logistique…" />
                <FTextarea label="Sur quoi travaille-t-il dans son accompagnement ?"
                  value={form.accompagnementEnCours}
                  onChange={e => upd("accompagnementEnCours", e.target.value)}
                  rows={2} placeholder="Démarches en cours, objectifs de son suivi actuel…" />
              </div>

              <div>
                <SectionTitle>7. Parcours & Motivation</SectionTitle>
                <FTextarea label="Parcours résumé (expériences, situation actuelle)"
                  value={form.parcoursResume}
                  onChange={e => upd("parcoursResume", e.target.value)}
                  rows={3} placeholder="Historique professionnel, contexte personnel pertinent…" />
              </div>

            </div>
          )}

          {/* ══ 4 — Freins ══ */}
          {step === 4 && (
            <div className="space-y-4">
              <StepLabel icon="⚠️" title="Freins socioprofessionnels identifiés"
                subtitle="Évaluer chaque frein et noter son niveau d'impact" />
              <div className="grid grid-cols-2 gap-3">
                {FREINS.map(f => (
                  <div key={f} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs font-semibold text-gray-600 mb-2">{f}</p>
                    <div className="flex gap-1 flex-wrap">
                      {FREINS_E.map(s => (
                        <button key={s} type="button"
                          onClick={() => upd("freinsEntree", { ...form.freinsEntree, [f]: form.freinsEntree[f] === s ? "" : s })}
                          className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
                            form.freinsEntree[f] === s
                              ? fC[s] + " border-current"
                              : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ 5 — Présentation EI ══ */}
          {step === 5 && (
            <div className="space-y-5">
              <StepLabel icon="🏭" title="Présentation de l'entreprise d'insertion"
                subtitle="Points clés à aborder — vérifier l'adhésion du candidat" />

              <div className="space-y-3">
                {[
                  { icon: "🏢", title: "Ce qu'est une entreprise d'insertion",
                    text: "Une structure qui emploie des personnes éloignées de l'emploi, avec un double objectif : un travail réel et productif, et un accompagnement vers un projet professionnel durable." },
                  { icon: "📆", title: "Durée d'accompagnement : 18 mois maximum",
                    text: "Contrats de 6 mois, renouvelables dans la limite de 18 mois au total. Le renouvellement n'est pas automatique." },
                  { icon: "✅", title: "2 conditions au renouvellement",
                    text: "1. Un travail irréprochable : qualité, ponctualité, absences, retards, comportement, consignes de sécurité.\n2. L'atteinte des objectifs d'insertion fixés avec le salarié." },
                  { icon: "🤝", title: "Des objectifs co-construits",
                    text: "Définis avec le salarié pour atteindre son projet professionnel le plus rapidement possible. On n'impose pas, on n'agit pas à la place — on accompagne dans les démarches." },
                ].map(pt => (
                  <div key={pt.title} className="flex gap-3 p-3.5 bg-indigo-50 rounded-xl border border-indigo-100">
                    <span className="text-xl shrink-0 mt-0.5">{pt.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-indigo-900 mb-0.5">{pt.title}</p>
                      <p className="text-xs text-indigo-700 whitespace-pre-line leading-relaxed">{pt.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3.5 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-colors">
                <input type="checkbox" checked={form.presentationFaite}
                  onChange={e => upd("presentationFaite", e.target.checked)}
                  className="w-4 h-4 rounded accent-green-600 cursor-pointer" />
                <p className="text-sm font-semibold text-green-800">Présentation effectuée</p>
              </label>

              {form.presentationFaite && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
                    Le candidat a compris et adhère ?
                  </label>
                  {[
                    { v: "oui",     l: "✓ Oui, clairement",                    bg: "bg-green-50 border-green-300 text-green-800"   },
                    { v: "partiel", l: "◐ Partiellement — point à retravailler", bg: "bg-orange-50 border-orange-300 text-orange-800" },
                    { v: "non",     l: "✗ Non — à éclaircir",                   bg: "bg-red-50 border-red-300 text-red-800"         },
                  ].map(o => (
                    <label key={o.v} className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all ${form.adhesionEI === o.v ? o.bg : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"}`}>
                      <input type="radio" name="adhesion" value={o.v} checked={form.adhesionEI === o.v}
                        onChange={() => upd("adhesionEI", o.v)} className="mt-0.5 accent-indigo-600" />
                      <span className="text-sm font-medium">{o.l}</span>
                    </label>
                  ))}
                  {(form.adhesionEI === "partiel" || form.adhesionEI === "non") && (
                    <FInput label="Point à préciser / à retravailler"
                      value={form.adhesionEICommentaire}
                      onChange={e => upd("adhesionEICommentaire", e.target.value)}
                      placeholder="Quel point n'est pas acquis ?" />
                  )}
                </div>
              )}

              {/* Info suite candidat */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500 italic">
                ℹ️ Le candidat devra rappeler ID'EES Intérim pour être informé de la suite donnée à sa candidature.
              </div>
            </div>
          )}

          {/* ══ 6 — Conclusion ══ */}
          {step === 6 && (
            <div className="space-y-5">
              <StepLabel icon="🏁" title="Évaluation & décision" subtitle="Impression globale et orientation à donner" />

              <FTextarea label="Observations / précisions / réserves"
                value={form.commentaireFinal}
                onChange={e => upd("commentaireFinal", e.target.value)}
                rows={2} placeholder="Points saillants de l'entretien, précisions sur l'orientation…" />

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                  Impression globale
                </label>
                <RadioChips options={IMPRESSIONS} value={form.impression} onChange={v => upd("impression", v)} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                  Orientation
                </label>
                <RadioChips options={ORIENTATIONS} value={form.orientation} onChange={v => upd("orientation", v)} />
              </div>

              {form.orientation && form.orientation !== "recrute" && (
                <FInput
                  label={
                    form.orientation === "decliner"   ? "Motif de déclin" :
                    form.orientation === "vivier"     ? "Note vivier"     :
                    form.orientation === "evaluation" ? "Étape / précision (facultatif)" : "Précision"
                  }
                  value={form.orientationMotif}
                  onChange={e => upd("orientationMotif", e.target.value)}
                  placeholder="Ex : Profil adapté, manque d'expérience, prochaine ouverture prévue…" />
              )}

              {(form.orientation === "recrute" || form.orientation === "vivier") && sites.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                    Filiale / Activité(s) pressenties
                    <span className="text-gray-400 font-normal normal-case ml-1">— plusieurs choix possibles</span>
                  </label>
                  <SiteMultiSelector sites={sites} value={form.orientationSiteIds} onChange={v => upd("orientationSiteIds", v)} />
                </div>
              )}

              {err && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center">
          <button type="button"
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100">
            {step === 0 ? "Annuler" : "← Précédent"}
          </button>

          <div className="flex gap-2">
            {step < STEPS.length - 1 ? (
              <>
                {step > 0 && (
                  <button type="button" onClick={() => setStep(STEPS.length - 1)}
                    className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-gray-200">
                    Passer à la conclusion →→
                  </button>
                )}
                <button type="button"
                  onClick={() => canNext && setStep(s => s + 1)}
                  disabled={!canNext}
                  className="px-5 py-2 rounded-xl text-sm bg-indigo-600 text-white font-medium disabled:opacity-40 hover:bg-indigo-700">
                  Suivant →
                </button>
              </>
            ) : (
              <button type="button" onClick={handleSave}
                disabled={!form.date || form.avecQui.length === 0 || saving}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold flex items-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {saving ? "Enregistrement…" : "✓ Enregistrer l'entretien"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
