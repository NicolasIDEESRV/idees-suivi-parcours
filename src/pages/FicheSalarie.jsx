import { useState } from "react";
import { BADGES, FREINS } from "../lib/constants";
import { fmt, getAge, dureeM, daysUntil, urgC } from "../lib/utils";
import { fC } from "../lib/theme";
import { Card, Row } from "../components/ui";
import EntretienForm from "../components/EntretienForm";

export default function FicheSalarie({ salarie, entretiens, user, users, setPage, onEdit, onAddEntretien, onOpenSortie, onDelete }) {
  const [tab,   setTab]   = useState("apercu");
  const [showE, setShowE] = useState(false);

  const mesE    = entretiens.filter(e => e.salarie_id === salarie.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const tousObj = mesE.flatMap(e => e.objectifs || []).filter(o => o.intitule);
  const objEnCours = tousObj.filter(o => o.atteint === null || o.atteint === undefined);
  const pct = Math.min(100, Math.round(dureeM(salarie.dateEntree, salarie.dateSortie) / 24 * 100));

  const tabs = [
    { id: "apercu",     l: "Aperçu" },
    { id: "entretiens", l: `Entretiens (${mesE.length})` },
    { id: "objectifs",  l: `Objectifs (${tousObj.length})` },
    { id: "freins",     l: "Freins" },
    { id: "admin",      l: "Admin" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {showE && (
        <EntretienForm
          salarie={salarie}
          objectifsExistants={tousObj}
          users={users}
          onSave={e => { onAddEntretien(e); setShowE(false); }}
          onClose={() => setShowE(false)}
        />
      )}

      {/* ── Zone sticky : bouton retour + en-tête + onglets ────────────────── */}
      <div className="sticky top-0 z-20 bg-gray-50 px-6 pt-5 pb-3 border-b border-gray-100 shadow-sm">
        <button onClick={() => setPage("salaries")} className="text-sm text-gray-400 hover:text-indigo-600 mb-3 block">← Retour</button>

        {/* En-tête salarié */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
              <span className="text-indigo-700 text-lg font-bold">{salarie.nom[0]}{salarie.prenom[0]}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{salarie.nom} {salarie.prenom}</h1>
              <p className="text-sm text-gray-400">{getAge(salarie.dateNaissance) || "?"} ans · {salarie.prescripteur}</p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {salarie.deld       && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">DELD</span>}
                {salarie.brsa       && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">BRSA</span>}
                {salarie.th         && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">TH</span>}
                {salarie.residentQPV && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">QPV</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${salarie.dateSortie ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
                  {salarie.dateSortie ? "Sorti" : "Actif"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <button onClick={() => onEdit(salarie)} className="text-sm text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-2 rounded-xl">✏ Modifier</button>
            <button onClick={() => setShowE(true)}  className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl">+ Entretien</button>
            {!salarie.dateSortie && <button onClick={() => onOpenSortie(salarie)} className="text-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-2 rounded-xl">Sortir</button>}
            {user.role === "admin" && (
              <button
                onClick={() => {
                  if (window.confirm(`Supprimer définitivement ${salarie.nom} ${salarie.prenom} ? Cette action est irréversible et supprimera aussi tous ses entretiens et objectifs.`)) {
                    onDelete(salarie.id);
                  }
                }}
                className="text-sm text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-200 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
                title="Supprimer le salarié (admin)"
              >
                🗑
              </button>
            )}
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{fmt(salarie.dateEntree)}</span>
            <span className="font-medium text-gray-600">{dureeM(salarie.dateEntree, salarie.dateSortie)} mois · {pct}%</span>
            <span>{fmt(salarie.dateFinContrat)}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-orange-400" : "bg-indigo-400"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Objectifs en cours */}
        {objEnCours.length > 0 && (
          <div className="mt-3 space-y-1">
            {objEnCours.map(o => {
              const d = daysUntil(o.deadline);
              return (
                <div key={o.id} className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm ${urgC(d)}`}>
                  <span className="font-medium">🎯 {o.intitule}</span>
                  <span className="text-xs">{d < 0 ? `Dépassé de ${Math.abs(d)}j` : d <= 7 ? `${d}j restants` : `échéance ${fmt(o.deadline)}`}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Alertes échéances */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {[{ l: "Fin contrat", d: salarie.dateFinContrat }, { l: "Fin agrément", d: salarie.dateFinAgrement }, { l: "CSS", d: salarie.cssJusquau }].map(a => {
            const dj = daysUntil(a.d);
            if (dj === null || dj > 60) return null;
            return <span key={a.l} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${urgC(dj)}`}>{a.l} : {dj < 0 ? "dépassé" : `${dj}j`}</span>;
          })}
        </div>
      </div>

        {/* Onglets */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1 w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.id ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              {t.l}
            </button>
          ))}
        </div>
      </div>{/* ── Contenu scrollable ─────────────────────────────────────────────────── */}
      <div className="px-6 py-5 flex-1">

      {/* Aperçu */}
      {tab === "apercu" && (
        <div className="grid grid-cols-2 gap-4">
          <Card title="Projet pro">
            <p className="text-sm font-medium text-gray-900">{salarie.projetPro || "—"}</p>
            <p className="text-sm text-gray-400 mt-1">{salarie.preconisation}</p>
            <div className="flex gap-1 mt-2">{salarie.domainesPro?.filter(Boolean).map(d => <span key={d} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{d}</span>)}</div>
          </Card>
          <Card title="Open Badges">
            <div className="space-y-2">
              {BADGES.map(b => (
                <div key={b} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{b}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-3.5 h-3.5 rounded-full ${i <= (salarie.badges?.[b] || 0) ? "bg-indigo-500" : "bg-gray-100"}`} />)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Mobilité & langue">
            <Row label="Permis B"  v={salarie.permisB ? "✓ Oui" : "✗ Non"} />
            <Row label="Véhicule"  v={salarie.vehicule ? "✓ Oui" : "✗ Non"} />
            <Row label="Transport" v={salarie.moyenTransport} />
            <Row label="Langue"    v={salarie.niveauLangue} />
            <Row label="CV"        v={salarie.cv ? "✓" : "✗"} />
          </Card>
          <Card title="Ressources">
            <Row label="Revenus"  v={salarie.revenus ? `${salarie.revenus} €/mois` : "—"} />
            <Row label="Charges"  v={salarie.charges ? `${salarie.charges} €/mois` : "—"} />
            <Row label="Dettes"   v={salarie.dettes || "—"} />
          </Card>
        </div>
      )}

      {/* Entretiens */}
      {tab === "entretiens" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex justify-between mb-5">
            <h2 className="font-semibold text-gray-800">Timeline</h2>
            <button onClick={() => setShowE(true)} className="text-sm text-indigo-600 hover:underline">+ Ajouter</button>
          </div>
          {mesE.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">Aucun entretien</p>
            : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
                <div className="space-y-3">
                  {mesE.map((e, i) => {
                    const futur = new Date(e.date) > new Date();
                    const resp  = users.find(u => u.id === e.assignedTo);
                    return (
                      <div key={e.id} className="flex gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold ${e.jalon ? "bg-amber-400 text-white" : futur ? "bg-indigo-100 text-indigo-400 border-2 border-dashed border-indigo-300" : "bg-indigo-600 text-white"}`}>
                          {e.jalon ? "J" : mesE.length - i}
                        </div>
                        <div className={`flex-1 rounded-xl border p-3 ${futur ? "bg-indigo-50 border-indigo-100" : e.jalon ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"}`}>
                          <div className="flex justify-between mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900">{e.type}</span>
                              {e.jalon && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Jalon</span>}
                              {resp    && <span className="text-xs text-gray-400">· {resp.prenom} {resp.nom}</span>}
                            </div>
                            <span className="text-xs text-gray-400">{fmt(e.date)}</span>
                          </div>
                          {e.sujets  && <p className="text-xs text-gray-600 mb-1"><strong>Sujets :</strong> {e.sujets}</p>}
                          {e.synthese && <p className="text-xs text-gray-600"><strong>Synthèse :</strong> {e.synthese}</p>}
                          {(e.objectifs || []).length > 0 && (
                            <div className="mt-2 space-y-1">
                              {e.objectifs.map(o => (
                                <div key={o.id} className={`flex items-center justify-between text-xs px-2 py-1 rounded-lg ${o.atteint === true ? "bg-green-100 text-green-700" : o.atteint === false ? "bg-red-100 text-red-700" : "bg-white border border-gray-200 text-gray-600"}`}>
                                  <span>🎯 {o.intitule}</span>
                                  <span>{o.atteint === true ? "✓ Atteint" : o.atteint === false ? "✗ Non atteint" : fmt(o.deadline)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          }
        </div>
      )}

      {/* Objectifs */}
      {tab === "objectifs" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Tous les objectifs</h2>
          {tousObj.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">Aucun objectif défini</p>
            : (
              <div className="space-y-2">
                {tousObj.map(o => {
                  const d = daysUntil(o.deadline);
                  return (
                    <div key={o.id} className={`flex items-center justify-between p-4 rounded-xl border ${o.atteint === true ? "bg-green-50 border-green-200" : o.atteint === false ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"}`}>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{o.intitule}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Échéance : {fmt(o.deadline)}</p>
                        {o.commentaire && <p className="text-xs text-gray-500 italic">{o.commentaire}</p>}
                      </div>
                      {o.atteint === true
                        ? <span className="text-sm font-bold text-green-600 bg-green-100 px-3 py-1.5 rounded-full">✓ Atteint</span>
                        : o.atteint === false
                        ? <span className="text-sm font-bold text-red-600 bg-red-100 px-3 py-1.5 rounded-full">✗ Non atteint</span>
                        : <span className={`text-xs px-2 py-1 rounded-full border font-medium ${urgC(d)}`}>{d < 0 ? `Dépassé de ${Math.abs(d)}j` : d === 0 ? "Aujourd'hui" : `${d}j`}</span>
                      }
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      )}

      {/* Freins */}
      {tab === "freins" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-3 text-xs font-semibold text-gray-400 uppercase">Frein</th>
                <th className="text-center pb-3 text-xs font-semibold text-gray-400 uppercase">Entrée</th>
                <th className="text-center pb-3 text-xs font-semibold text-gray-400 uppercase">Sortie</th>
              </tr>
            </thead>
            <tbody>
              {FREINS.map(f => (
                <tr key={f} className="border-b border-gray-50">
                  <td className="py-2.5 text-gray-700">{f}</td>
                  <td className="py-2.5 text-center"><span className={`text-xs px-2 py-1 rounded-full font-medium ${fC[salarie.freinsEntree?.[f] || ""]}`}>{salarie.freinsEntree?.[f] || "—"}</span></td>
                  <td className="py-2.5 text-center"><span className={`text-xs px-2 py-1 rounded-full font-medium ${fC[salarie.freinsSortie?.[f] || ""]}`}>{salarie.freinsSortie?.[f] || "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin */}
      {tab === "admin" && (
        <div className="grid grid-cols-2 gap-4">
          <Card title="Identité">
            <Row label="Nom"         v={salarie.nom} />
            <Row label="Prénom"      v={salarie.prenom} />
            <Row label="Naissance"   v={`${fmt(salarie.dateNaissance)} (${getAge(salarie.dateNaissance)} ans)`} />
            <Row label="Nationalité" v={salarie.nationalite} />
            <Row label="Tél"         v={salarie.telephone || "—"} />
            <Row label="Mail"        v={salarie.mail || "—"} />
          </Card>
          <Card title="Parcours IAE">
            <Row label="Entrée"      v={fmt(salarie.dateEntree)} />
            <Row label="Fin contrat" v={fmt(salarie.dateFinContrat)} />
            <Row label="Fin agrément" v={fmt(salarie.dateFinAgrement)} />
            <Row label="ID FT"       v={salarie.idFT || "—"} />
            <Row label="Prescripteur" v={salarie.prescripteur} />
          </Card>
        </div>
      )}
      </div>{/* fin contenu scrollable */}
    </div>
  );
}
