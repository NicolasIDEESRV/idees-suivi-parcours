import { useState } from "react";

export default function JalonConfirmModal({ jalons, users, onConfirm, onClose }) {
  const [data, setData] = useState(
    Object.fromEntries(jalons.map(j => [j.id, { date: j.date, assignedTo: j.assignedTo }]))
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Entretiens jalons — confirmer les dates</h2>
          <p className="text-sm text-gray-400 mt-1">Ajustez les dates et assignez chaque entretien.</p>
        </div>
        <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
          {jalons.map(j => (
            <div key={j.id} className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-sm font-semibold text-indigo-900 mb-2">
                {j.jalonLabel} <span className="text-xs text-indigo-500 font-normal">· {j.participants}</span>
              </p>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 border border-indigo-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                  value={data[j.id].date}
                  onChange={e => setData(d => ({ ...d, [j.id]: { ...d[j.id], date: e.target.value } }))}
                />
                <select
                  className="flex-1 border border-indigo-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                  value={data[j.id].assignedTo}
                  onChange={e => setData(d => ({ ...d, [j.id]: { ...d[j.id], assignedTo: e.target.value } }))}
                >
                  {users.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-gray-100 flex justify-between">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Annuler</button>
          <button onClick={() => onConfirm(data)} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">✓ Valider</button>
        </div>
      </div>
    </div>
  );
}
