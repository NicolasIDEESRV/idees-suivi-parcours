export const Card = ({ title, children, action }) => (
  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h3>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export const Row = ({ label, v }) => (
  <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0 gap-4">
    <span className="text-xs text-gray-400 shrink-0">{label}</span>
    <span className="text-sm font-medium text-gray-800 text-right">{v ?? "—"}</span>
  </div>
);

export const FInput = ({ label, required, highlight, ...p }) => (
  <div>
    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      {highlight && <span className="ml-1.5 text-xs text-amber-600 font-normal normal-case bg-amber-50 px-1.5 py-0.5 rounded-full">↩ récupéré</span>}
    </label>
    <input
      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white ${highlight ? "border-amber-300 bg-amber-50 focus:ring-amber-200" : "border-gray-200 focus:ring-indigo-200"}`}
      {...p}
    />
  </div>
);

export const FSelect = ({ label, required, highlight, children, ...p }) => (
  <div>
    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      {highlight && <span className="ml-1.5 text-xs text-amber-600 font-normal normal-case bg-amber-50 px-1.5 py-0.5 rounded-full">↩ récupéré</span>}
    </label>
    <select
      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white ${highlight ? "border-amber-300 bg-amber-50 focus:ring-amber-200" : "border-gray-200 focus:ring-indigo-200"}`}
      {...p}
    >
      {children}
    </select>
  </div>
);

export const FCheck = ({ label, checked, onChange, highlight }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" className="w-4 h-4 rounded accent-indigo-600" checked={!!checked} onChange={onChange} />
    <span className={`text-sm ${highlight ? "text-amber-700 font-medium" : "text-gray-700"}`}>{label}</span>
    {highlight && <span className="text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">↩</span>}
  </label>
);

export const FTextarea = ({ label, disabled, highlight, ...p }) => (
  <div>
    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1">
      {label}
      {highlight && <span className="ml-1.5 text-xs text-amber-600 font-normal normal-case bg-amber-50 px-1.5 py-0.5 rounded-full">↩ récupéré</span>}
    </label>
    <textarea
      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none ${disabled ? "bg-gray-50 text-gray-400 border-gray-200" : highlight ? "border-amber-300 bg-amber-50 focus:ring-amber-200" : "border-gray-200 focus:ring-indigo-200"}`}
      rows={3}
      disabled={disabled}
      {...p}
    />
  </div>
);

export const FSec = ({ children }) => (
  <div className="col-span-2 border-b border-indigo-100 pb-1 mt-3">
    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{children}</p>
  </div>
);

// ─── SiteOptions ──────────────────────────────────────────────────────────────
// Génère des <optgroup>/<option> groupés par filiale › secteur › activité
// Usage : <select ...><SiteOptions sites={sites} /></select>
// ou avec option "tous" : <select><option value="all">Tous</option><SiteOptions sites={sites} /></select>
function siteOptionLabel(s) {
  const parts = [];
  if (s.secteur && s.secteur !== s.filiale)  parts.push(s.secteur);
  if (s.activite && s.activite !== s.secteur) parts.push(s.activite);
  parts.push(s.nom);
  return parts.join(" › ");
}

export function SiteOptions({ sites }) {
  if (!sites || sites.length === 0) return null;

  // Trier alphabétiquement par label complet (regroupe ainsi les activités similaires)
  const sorted = [...sites].sort((a, b) => siteOptionLabel(a).localeCompare(siteOptionLabel(b), "fr"));

  // Grouper par filiale (ordre alpha)
  const byFiliale = {};
  sorted.forEach(s => {
    const fil = s.filiale || "";
    if (!byFiliale[fil]) byFiliale[fil] = [];
    byFiliale[fil].push(s);
  });

  const keys = Object.keys(byFiliale).sort((a, b) => a.localeCompare(b, "fr"));

  // Si tous les sites sont dans la même filiale (ou sans filiale) : pas d'optgroup
  if (keys.length === 1) {
    return byFiliale[keys[0]].map(s => (
      <option key={s.id} value={s.id}>{siteOptionLabel(s)}</option>
    ));
  }

  // Plusieurs filiales → optgroup par filiale (trié alpha)
  return keys.map(fil => (
    <optgroup key={fil || "—"} label={fil || "Autres"}>
      {byFiliale[fil].map(s => (
        <option key={s.id} value={s.id}>{siteOptionLabel(s)}</option>
      ))}
    </optgroup>
  ));
}
