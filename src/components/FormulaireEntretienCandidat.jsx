import { useState } from "react";
import { todayStr } from "../lib/utils";
import { PRESCRIPTEURS, NIVEAUX_LANGUE, FREINS, FREINS_E } from "../lib/constants";
import { fC } from "../lib/theme";
import { FInput, FSelect, FTextarea } from "./ui";

// ─── Options impression / orientation ────────────────────────────────────────
const IMPRESSIONS = [
  { v: "tres_bien", l: "Très bien",  bg: "bg-green-100 text-green-800 border-green-300",   dot: "bg-green-500"  },
  { v: "bien",      l: "Bien",       bg: "bg-blue-100  text-blue-800  border-blue-300",    dot: "bg-blue-500"   },
  { v: "doute",     l: "Doute",      bg: "bg-orange-100 text-orange-800 border-orange-300", dot: "bg-orange-400" },
  { v: "decliner",  l: "À décliner", bg: "bg-red-100   text-red-800   border-red-300",     dot: "bg-red-500"    },
];
const ORIENTATIONS = [
  { v: "evaluation", l: "Évaluation en cours", bg: "bg-orange-100 text-orange-800 border-orange-300", dot: "bg-orange-400" },
  { v: "recrute",    l: "Recruter",             bg: "bg-green-100 text-green-800 border-green-300",   dot: "bg-green-500"  },
  { v: "vivier",     l: "Vivier",               bg: "bg-blue-100  text-blue-800  border-blue-300",    dot: "bg-blue-500"   },
  { v: "decliner",   l: "Décliner",             bg: "bg-red-100   text-red-800   border-red-300",     dot: "bg-red-500"    },
];
const RECHERCHE_OPTIONS = ["Moins de 6 mois","6 à 12 mois","1 à 2 ans","2 à 5 ans","Plus de 5 ans"];
const PIECE_OPTIONS = [
  { v: "cni",       l: "Carte d'identité"     },
  { v: "passeport", l: "Passeport UE"         },
  { v: "titre",     l: "Titre de séjour"      },
];

// ─── Radio chips visuels ──────────────────────────────────────────────────────
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

// ─── Sélecteur de site ────────────────────────────────────────────────────────
function SiteSelector({ sites, value, onChange }) {
  const filialesList = [...new Set(sites.map(s => s.filiale).filter(Boolean))];
  const [openFil, setOpenFil] = useState(null);
  return (
    <div className="space-y-2">
      {filialesList.map(fil => {
        const filSites = sites.filter(s => s.filiale === fil);
        const isOpen   = openFil === fil;
        const selSite  = filSites.find(s => s.id === value);
        return (
          <div key={fil} className="border border-gray-200 rounded-xl overflow-hidden">
            <button type="button" onClick={() => setOpenFil(isOpen ? null : fil)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700">
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
                      className="accent-indigo-600" />
                    <span className="text-xs text-gray-700">{s.nom}{s.ville ? ` — ${s.ville}` : ""}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {value && (
        <button type="button" onClick={() => onChange(null)} className="text-xs text-red-400 hover:text-red-600">✕ Effacer</button>
      )}
    </div>
  );
}

// ─── Sélecteur multi-utilisateurs ─────────────────────────────────────────────
function UserMultiSelect({ users, value = [], onChange }) {
  const byRole = users.reduce((acc, u) => {
    const r = u.role === "admin" ? "Direction" : "CIP";
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
                    sel
                      ? "bg-indigo-100 text-indigo-800 border-indigo-300 shadow-sm"
                      : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
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

// ─── Étape header ─────────────────────────────────────────────────────────────
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

// ─── Composant principal ──────────────────────────────────────────────────────
const STEPS = ["Entretien", "Profil", "Projet & Freins", "Présentation EI", "Conclusion"];

export default function FormulaireEntretienCandidat({
  salarie, sites = [], users = [],
  onSaveEntretien, onSaveCandidat, onClose
}) {
  const [typeChoice, setTypeChoice] = useState(null);
  const [step,       setStep]       = useState(0);

  const [form, setForm] = useState({
    // ── Entretien
    date:         todayStr,
    assignedTo:   salarie.cip_id || (users[0]?.id ?? ""),
    avecQui:      [],          // IDs des utilisateurs présents
    ou:           "",

    // ── Profil
    prescripteur:        salarie.prescripteur        || "",
    autreAccompagnateur: salarie.autreAccompagnateur  || "",
    enRecherchDepuis:    salarie.enRecherchDepuis     || "",
    pieceIdentite:       salarie.pieceIdentite        || "",
    titreSejourValidite: salarie.titreSejourValidite  || "",

    // ── Compétences & Contraintes
    niveauLangue:       salarie.niveauLangue       || "",
    contraintePhysique: salarie.contraintePhysique || "",
    contrainteHoraire:  salarie.contrainteHoraire  || "",
    projetPro:          salarie.projetPro          || "",
    parcoursMotivation: "",

    // ── Freins
    freinsEntree: { ...(salarie.freinsEntree || {}) },

    // ── Présentation EI
    presentationFaite:        false,
    adhesionEI:               "",   // "oui" | "partiel" | "non"
    adhesionEICommentaire:    "",

    // ── Conclusion
    impression:         salarie.impressionGlobale    || "",
    orientation:        salarie.orientationCandidat  || "",
    orientationMotif:   salarie.orientationMotif     || "",
    orientationSiteId:  salarie.orientationSiteId    ?? null,
    commentaireFinal:   "",
  });

  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canNext = step === 0
    ? form.date && form.avecQui.length > 0
    : true;

  // ── Enregistrement final ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.date || form.avecQui.length === 0) return;
    setSaving(true);
    setErr("");
    try {
      // Noms des participants
      const participantNames = form.avecQui
        .map(id => { const u = users.find(x => x.id === id); return u ? `${u.prenom} ${u.nom}` : id; })
        .join(", ");

      const typeLabel = typeChoice === "tel" ? "Entretien téléphonique" : "Entretien physique";

      const sujets = [
        typeChoice === "phys" && form.ou ? `Lieu : ${form.ou}` : null,
        form.parcoursMotivation           ? `Parcours & Motivation : ${form.parcoursMotivation}` : null,
      ].filter(Boolean).join(" · ");

      await onSaveEntretien({
        id:           null,
        salarie_id:   salarie.id,
        cip_id:       form.assignedTo,
        assignedTo:   form.assignedTo,
        date:         form.date,
        type:         typeLabel,
        sujets,
        synthese:     form.commentaireFinal,
        participants: participantNames,
        jalon:        false,
        objectifs:    [],
      });

      // Mise à jour des champs candidat
      const updates = {
        // Profil
        prescripteur:        form.prescripteur        || salarie.prescripteur,
        autreAccompagnateur: form.autreAccompagnateur || salarie.autreAccompagnateur,
        enRecherchDepuis:    form.enRecherchDepuis     || salarie.enRecherchDepuis,
        pieceIdentite:       form.pieceIdentite        || salarie.pieceIdentite,
        titreSejourValidite: form.titreSejourValidite  || salarie.titreSejourValidite,
        // Compétences
        niveauLangue:       form.niveauLangue       || salarie.niveauLangue,
        contraintePhysique: form.contraintePhysique || salarie.contraintePhysique,
        contrainteHoraire:  form.contrainteHoraire  || salarie.contrainteHoraire,
        projetPro:          form.projetPro          || salarie.projetPro,
        // Freins
        freinsEntree:       form.freinsEntree,
        // Entretien
        vuEntretienLe:      form.date,
        impressionGlobale:  form.impression   || salarie.impressionGlobale,
        impressionDetail:   form.commentaireFinal || salarie.impressionDetail,
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

  // ── Étape 0 : Choisir le type ────────────────────────────────────────────────
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

  // ── Formulaire multi-étapes ──────────────────────────────────────────────────
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:100, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"2rem", overflowY:"auto" }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl mb-8">

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">
              {typeChoice === "tel" ? "📞 Entretien téléphonique" : "🤝 Entretien physique"}
            </h2>
            <p className="text-sm text-gray-400">{salarie.nom} {salarie.prenom}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setTypeChoice(null); setStep(0); }}
              className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">← Changer</button>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
          </div>
        </div>

        {/* ── Barre de progression ── */}
        <div className="px-5 pt-4">
          <div className="flex gap-1.5 mb-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-indigo-500" : "bg-gray-100"}`} />
            ))}
          </div>
          <div className="flex justify-between">
            <p className="text-xs text-gray-400">{STEPS[step]}</p>
            <p className="text-xs text-gray-400">{step + 1} / {STEPS.length}</p>
          </div>
        </div>

        {/* ── Contenu ── */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* ═══ ÉTAPE 0 — Info entretien ═══ */}
          {step === 0 && (
            <div className="space-y-5">
              <StepLabel icon="📅" title="Informations de l'entretien" />

              <div className="grid grid-cols-2 gap-4">
                <FInput label="Date *" type="date" value={form.date}
                  onChange={e => upd("date", e.target.value)} />

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Réalisé par</label>
                  <select value={form.assignedTo} onChange={e => upd("assignedTo", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200">
                    {users.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
                  </select>
                </div>
              </div>

              {typeChoice === "phys" && (
                <FInput label="Lieu" value={form.ou}
                  onChange={e => upd("ou", e.target.value)}
                  placeholder="Ex : Bureau CIP, Firminy" />
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

          {/* ═══ ÉTAPE 1 — Profil candidat ═══ */}
          {step === 1 && (
            <div className="space-y-4">
              <StepLabel icon="👤" title="Profil du candidat" subtitle="Informations d'accompagnement et pièces d'identité" />

              <div className="grid grid-cols-2 gap-4">
                <FSelect label="Prescripteur" value={form.prescripteur}
                  onChange={e => upd("prescripteur", e.target.value)}>
                  <option value="">—</option>
                  {PRESCRIPTEURS.map(p => <option key={p}>{p}</option>)}
                </FSelect>

                <FInput label="Autre accompagnateur" value={form.autreAccompagnateur}
                  onChange={e => upd("autreAccompagnateur", e.target.value)}
                  placeholder="Nom, organisme…" />
              </div>

              <FSelect label="En recherche active depuis" value={form.enRecherchDepuis}
                onChange={e => upd("enRecherchDepuis", e.target.value)}>
                <option value="">—</option>
                {RECHERCHE_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </FSelect>

              {/* ── Pièce d'identité ── */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                  Pièce d'identité
                </label>
                <div className="flex flex-wrap gap-2">
                  {PIECE_OPTIONS.map(o => (
                    <button key={o.v} type="button"
                      onClick={() => upd("pieceIdentite", form.pieceIdentite === o.v ? "" : o.v)}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        form.pieceIdentite === o.v
                          ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                          : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                      }`}>
                      {o.l}
                    </button>
                  ))}
                </div>
                {form.pieceIdentite === "titre" && (
                  <div className="mt-3">
                    <FInput label="Titre de séjour — valable jusqu'au"
                      type="date" value={form.titreSejourValidite}
                      onChange={e => upd("titreSejourValidite", e.target.value)} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ ÉTAPE 2 — Projet, Compétences & Freins ═══ */}
          {step === 2 && (
            <div className="space-y-5">
              <StepLabel icon="🎯" title="Projet, compétences & freins identifiés" />

              <div className="grid grid-cols-2 gap-4">
                <FSelect label="Niveau de langue" value={form.niveauLangue}
                  onChange={e => upd("niveauLangue", e.target.value)}>
                  <option value="">—</option>
                  {NIVEAUX_LANGUE.map(n => <option key={n}>{n}</option>)}
                </FSelect>
                <div />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FTextarea label="Contrainte physique"
                  value={form.contraintePhysique}
                  onChange={e => upd("contraintePhysique", e.target.value)}
                  rows={2} placeholder="Ex : port de charges limité, station debout prolongée…" />
                <FTextarea label="Contrainte horaire"
                  value={form.contrainteHoraire}
                  onChange={e => upd("contrainteHoraire", e.target.value)}
                  rows={2} placeholder="Ex : pas de nuit, pas le mercredi…" />
              </div>

              <FInput label="Projet professionnel"
                value={form.projetPro}
                onChange={e => upd("projetPro", e.target.value)}
                placeholder="Ex : Agent logistique, Espaces verts…" />

              <FTextarea label="Parcours & Motivation"
                value={form.parcoursMotivation}
                onChange={e => upd("parcoursMotivation", e.target.value)}
                rows={3}
                placeholder="Résumé du parcours professionnel, motivations exprimées, atouts…" />

              {/* ── Freins ── */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-3">
                  Freins identifiés
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {FREINS.map(f => (
                    <div key={f} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs font-semibold text-gray-600 mb-2">{f}</p>
                      <div className="flex gap-1 flex-wrap">
                        {FREINS_E.map(s => (
                          <button key={s} type="button"
                            onClick={() => upd("freinsEntree", {
                              ...form.freinsEntree,
                              [f]: form.freinsEntree[f] === s ? "" : s,
                            })}
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
            </div>
          )}

          {/* ═══ ÉTAPE 3 — Présentation entreprise d'insertion ═══ */}
          {step === 3 && (
            <div className="space-y-5">
              <StepLabel icon="🏭" title="Présentation de l'entreprise d'insertion"
                subtitle="Points clés à aborder et vérifier l'adhésion du candidat" />

              {/* Points clés */}
              <div className="space-y-3">
                {[
                  {
                    icon: "🏢",
                    title: "Ce qu'est une entreprise d'insertion",
                    text: "Une structure qui emploie des personnes éloignées de l'emploi, avec un double objectif : un travail réel et productif, et un accompagnement vers un projet professionnel durable.",
                  },
                  {
                    icon: "📆",
                    title: "Durée d'accompagnement : 18 mois maximum",
                    text: "Contrats de 6 mois, renouvelables dans la limite de 18 mois au total. Le renouvellement n'est pas automatique.",
                  },
                  {
                    icon: "✅",
                    title: "2 conditions au renouvellement",
                    text: "1. Un travail irréprochable : qualité, ponctualité, absences, retards, comportement, consignes de sécurité.\n2. L'atteinte des objectifs d'insertion fixés avec le salarié.",
                  },
                  {
                    icon: "🤝",
                    title: "Des objectifs co-construits",
                    text: "Définis avec le salarié pour atteindre son projet professionnel le plus rapidement possible. On n'impose pas, on n'agit pas à la place — on accompagne dans les démarches.",
                  },
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

              {/* Case à cocher présentation effectuée */}
              <label className="flex items-center gap-3 cursor-pointer p-3.5 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-colors">
                <input type="checkbox" checked={form.presentationFaite}
                  onChange={e => upd("presentationFaite", e.target.checked)}
                  className="w-4 h-4 rounded accent-green-600 cursor-pointer" />
                <p className="text-sm font-semibold text-green-800">
                  Présentation de l'entreprise d'insertion effectuée
                </p>
              </label>

              {/* Adhésion candidat */}
              {form.presentationFaite && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
                    Le candidat a compris et adhère ?
                  </label>
                  <div className="space-y-2">
                    {[
                      { v: "oui",     l: "✓ Oui, clairement",               bg: "bg-green-50 border-green-300 text-green-800"   },
                      { v: "partiel", l: "◐ Partiellement — point à retravailler", bg: "bg-orange-50 border-orange-300 text-orange-800" },
                      { v: "non",     l: "✗ Non — à éclaircir",              bg: "bg-red-50 border-red-300 text-red-800"         },
                    ].map(o => (
                      <label key={o.v}
                        className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all ${
                          form.adhesionEI === o.v ? o.bg : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}>
                        <input type="radio" name="adhesion" value={o.v}
                          checked={form.adhesionEI === o.v}
                          onChange={() => upd("adhesionEI", o.v)}
                          className="mt-0.5 accent-indigo-600" />
                        <span className="text-sm font-medium">{o.l}</span>
                      </label>
                    ))}
                  </div>
                  {(form.adhesionEI === "partiel" || form.adhesionEI === "non") && (
                    <FInput label="Point à préciser / à retravailler"
                      value={form.adhesionEICommentaire}
                      onChange={e => upd("adhesionEICommentaire", e.target.value)}
                      placeholder="Quel point n'est pas acquis ?" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══ ÉTAPE 4 — Conclusion ═══ */}
          {step === 4 && (
            <div className="space-y-5">
              <StepLabel icon="🏁" title="Impression & orientation" subtitle="Suite à donner à cette candidature" />

              <FTextarea label="Commentaire général / Observations"
                value={form.commentaireFinal}
                onChange={e => upd("commentaireFinal", e.target.value)}
                rows={2}
                placeholder="Points saillants de l'entretien, prochains RDV prévus…" />

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                  Impression globale
                </label>
                <RadioChips options={IMPRESSIONS} value={form.impression} onChange={v => upd("impression", v)} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                  Avis d'orientation
                </label>
                <RadioChips options={ORIENTATIONS} value={form.orientation} onChange={v => upd("orientation", v)} />
              </div>

              {form.orientation && form.orientation !== "recrute" && (
                <FInput label={
                    form.orientation === "decliner"   ? "Motif de déclin" :
                    form.orientation === "vivier"     ? "Note vivier"     :
                    form.orientation === "evaluation" ? "Étape / précision (facultatif)" :
                    "Précision"
                  }
                  value={form.orientationMotif}
                  onChange={e => upd("orientationMotif", e.target.value)}
                  placeholder="Ex : Profil adapté, manque d'expérience, prochaine ouverture prévue…" />
              )}

              {(form.orientation === "recrute" || form.orientation === "vivier") && sites.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                    Filiale / Secteur / Activité / Site pressenti
                  </label>
                  <SiteSelector sites={sites} value={form.orientationSiteId} onChange={v => upd("orientationSiteId", v)} />
                </div>
              )}

              {err && (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center">
          <button type="button"
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100">
            {step === 0 ? "Annuler" : "← Précédent"}
          </button>

          <div className="flex gap-2">
            {step < STEPS.length - 1 ? (
              <>
                {step > 0 && step < STEPS.length - 1 && (
                  <button type="button" onClick={() => setStep(STEPS.length - 1)}
                    className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-gray-200">
                    Passer à la conclusion →→
                  </button>
                )}
                <button type="button"
                  onClick={() => canNext ? setStep(s => s + 1) : null}
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
