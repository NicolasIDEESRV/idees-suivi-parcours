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

export const FInput = ({ label, required, ...p }) => (
  <div>
    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <input
      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
      {...p}
    />
  </div>
);

export const FSelect = ({ label, required, children, ...p }) => (
  <div>
    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <select
      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
      {...p}
    >
      {children}
    </select>
  </div>
);

export const FCheck = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" className="w-4 h-4 rounded accent-indigo-600" checked={!!checked} onChange={onChange} />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

export const FTextarea = ({ label, disabled, ...p }) => (
  <div>
    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1">{label}</label>
    <textarea
      className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none ${disabled ? "bg-gray-50 text-gray-400" : ""}`}
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
