import { useState, useEffect, useRef } from "react";
import { TYPES_ENTRETIEN } from "../lib/constants";
import { todayStr, fmt, daysUntil, urgC } from "../lib/utils";
import { FInput, FSelect, FTextarea } from "./ui";

export default function EntretienForm({ salarie, initial, objectifsExistants, users, onSave, onClose }) {
  const [form, setForm] = useState({
    date: todayStr, type: "Suivi", sujets: "", synthese: "",
    dateBilan: "", assignedTo: salarie.cip_id || "u2", objectifs: [],
    ...(initial || {}),
  });
  const [draft, setDraft] = useState(false);
  const ref = useRef();

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addObj = () => setForm(f => ({ ...f, objectifs: [...f.objectifs, { id: "ob" + Date.now(), intitule: "", deadline: "", atteint: null, commentaire: "" }] }));
  const updObj = (id, k, v) => setForm(f => ({ ...f, objectifs: f.objectifs.map(o => o.id === id ? { ...o, [k]: v } : o) }));
  const delObj = id => setForm(f => ({ ...f, objectifs: f.objectifs.filter(o => o.id !== id) }));

  useEffect(() => {
    ref.current = setInterval(() => {
      if (form.synthese || form.sujets) { setDraft(true); setTimeout(() => setDraft(false), 2000); }
    }, 30000);
    return () => clearInterval(ref.current);
  }, [form]);

  const isBilan = form.type === "Bilan intermédiaire" || form.type === "Bilan de sortie";
  const isObj = form.type === "Définition des objectifs";
  const objARevoir = (objectifsExistants || []).filter(o => o.atteint === null || o.atteint === undefined);
  const [objRevue, setObjRevue] = useState(objARevoir.map(o => ({ ...o })));
  const updRevue = (id, k, v) => setObjRevue(prev => prev.map(o => o.id === id ? { ...o, [k]: v } : o));

  const handleSave = () => {
    onSave({ id: initial?.id || "e" + Date.now(), salarie_id: salarie.id, ...form, objectifsRevus: objRevue });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem", overflowY: "auto" }}>
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl mb-8">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">{initial ? "Modifier l'entretien" : "Nouvel entretien"}</h2>
            <p className="text-sm text-gray-400">{salarie.nom} {salarie.prenom}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[65vh]">
          <div className="grid grid-cols-2 gap-3">
            <FInput label="Date" type="date" value={form.date} onChange={e => upd("date", e.target.value)} />
            <FSelect label="Assigné à" value={form.assignedTo} onChange={e => upd("assignedTo", e.target.value)}>
              {users.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
            </FSelect>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPES_ENTRETIEN.map(t => (
                <button key={t} onClick={() => upd("type", t)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${form.type === t ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <FInput label="Sujets principaux" value={form.sujets} onChange={e => upd("sujets", e.target.value)} placeholder="Points abordés…" />
          <FTextarea label="Compte-rendu / Synthèse" value={form.synthese} onChange={e => upd("synthese", e.target.value)} />

          {isObj && (
            <>
              <FInput label="Date du bilan de vérification" type="date" value={form.dateBilan} onChange={e => upd("dateBilan", e.target.value)} />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Objectifs fixés</label>
                  <button onClick={addObj} className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg font-medium hover:bg-indigo-100">+ Ajouter</button>
                </div>
                <div className="space-y-3">
                  {form.objectifs.map(o => (
                    <div key={o.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                      <div className="flex gap-2">
                        <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Intitulé de l'objectif…" value={o.intitule} onChange={e => updObj(o.id, "intitule", e.target.value)} />
                        <button onClick={() => delObj(o.id)} className="text-gray-300 hover:text-red-400 text-lg px-1">×</button>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input type="date" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none" value={o.deadline} onChange={e => updObj(o.id, "deadline", e.target.value)} />
                        <span className="text-xs text-gray-400">échéance</span>
                      </div>
                    </div>
                  ))}
                  {form.objectifs.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Aucun objectif ajouté</p>}
                </div>
              </div>
            </>
          )}

          {isBilan && objARevoir.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Revue des objectifs en cours ({objARevoir.length})</p>
              <div className="space-y-3">
                {objRevue.map(o => {
                  const d = daysUntil(o.deadline);
                  return (
                    <div key={o.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{o.intitule}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium inline-block mt-1 ${urgC(d)}`}>Échéance : {fmt(o.deadline)}</span>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button type="button" onClick={() => updRevue(o.id, "atteint", o.atteint === true ? null : true)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${o.atteint === true ? "bg-green-600 text-white border-green-600 shadow-sm" : "bg-white text-gray-500 border-gray-300 hover:border-green-400 hover:text-green-600"}`}
                          >✓ Atteint</button>
                          <button type="button" onClick={() => updRevue(o.id, "atteint", o.atteint === false ? null : false)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${o.atteint === false ? "bg-red-600 text-white border-red-600 shadow-sm" : "bg-white text-gray-500 border-gray-300 hover:border-red-400 hover:text-red-600"}`}
                          >✗ Non atteint</button>
                        </div>
                      </div>
                      {o.atteint !== null && (
                        <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none" placeholder="Commentaire sur l'atteinte…" value={o.commentaire || ""} onChange={e => updRevue(o.id, "commentaire", e.target.value)} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex items-center justify-between">
          <span className={`text-xs text-gray-400 transition-opacity ${draft ? "opacity-100" : "opacity-0"}`}>✓ Brouillon sauvegardé</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100">Annuler</button>
            <button onClick={handleSave} className="px-5 py-2 rounded-xl text-sm bg-indigo-600 text-white font-medium hover:bg-indigo-700">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
