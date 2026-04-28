import { useState } from "react";
import { fmt } from "../lib/utils";

export default function FormulaireDeclinerCandidat({
  salarie, entretiens = [],
  onDecliner, onClose,
}) {
  const [evaluationFinale, setEvaluationFinale] = useState(salarie.orientationMotif || "");
  const [interimPropose,   setInterimPropose]   = useState(salarie.interimPropose || false);
  const [saving,           setSaving]           = useState(false);
  const [err,              setErr]              = useState("");

  const mesEntretiens = entretiens
    .filter(e => e.salarie_id === salarie.id && !e.jalon)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleConfirm = async () => {
    setSaving(true);
    setErr("");
    try {
      await onDecliner({ evaluationFinale, interimPropose });
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"2rem", overflowY:"auto" }}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl mb-8">

        {/* En-tête */}
        <div className="flex items-center justify-between p-5 border-b border-red-100 bg-red-50 rounded-t-2xl">
          <div>
            <h2 className="font-bold text-red-900 text-base">Décliner la candidature</h2>
            <p className="text-sm text-red-600 mt-0.5">{salarie.nom} {salarie.prenom}</p>
          </div>
          <button onClick={onClose} className="text-red-300 hover:text-red-600 text-2xl leading-none font-light">×</button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* ── Récap entretiens ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Entretiens réalisés
              <span className="ml-1.5 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-normal normal-case">
                {mesEntretiens.length}
              </span>
            </p>
            {mesEntretiens.length === 0 ? (
              <p className="text-sm text-gray-400 italic bg-gray-50 rounded-xl p-3">Aucun entretien enregistré</p>
            ) : (
              <div className="space-y-2">
                {mesEntretiens.map(e => {
                  const icon = e.type?.toLowerCase().includes("téléphonique") ? "📞"
                             : e.type?.toLowerCase().includes("physique")      ? "🤝"
                             : "📋";
                  return (
                    <div key={e.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0 text-base">
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-800 truncate">{e.type}</p>
                          <p className="text-xs text-gray-400 shrink-0">{fmt(e.date)}</p>
                        </div>
                        {e.synthese && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{e.synthese}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Évaluation finale ── */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Motif / Évaluation finale
            </label>
            <textarea
              value={evaluationFinale}
              onChange={e => setEvaluationFinale(e.target.value)}
              rows={3}
              placeholder="Ex : Profil non adapté aux postes disponibles, manque de disponibilité, problème de mobilité…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
            />
          </div>

          {/* ── Proposition ID'EES Intérim ── */}
          <label className="flex items-start gap-3 cursor-pointer p-3.5 bg-purple-50 rounded-xl border-2 border-purple-200 hover:bg-purple-100 transition-colors select-none">
            <input
              type="checkbox"
              checked={interimPropose}
              onChange={e => setInterimPropose(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-purple-600 cursor-pointer"
            />
            <div>
              <p className="text-sm font-semibold text-purple-800">Proposition ID'EES Intérim</p>
              <p className="text-xs text-purple-600 mt-0.5">Le candidat sera orienté vers ID'EES Intérim</p>
            </div>
          </label>

          {err && (
            <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>
          )}
        </div>

        {/* ── Pied de formulaire ── */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold flex items-center gap-2"
          >
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? "Enregistrement…" : "✗ Décliner la candidature"}
          </button>
        </div>
      </div>
    </div>
  );
}
