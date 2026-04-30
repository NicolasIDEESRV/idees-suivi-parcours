import { getThemeForUser } from "../lib/theme";
import { getLogoForUser } from "../lib/logos";

// ─── Icônes SVG inline ────────────────────────────────────────────────────────
const NAV_ICONS = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M2 10a8 8 0 1116 0A8 8 0 012 10zm5-1a1 1 0 000 2h1v1a1 1 0 002 0v-1h1a1 1 0 000-2H9V8a1 1 0 00-2 0v1H6z"/>
      <path fillRule="evenodd" d="M3 10a7 7 0 1114 0A7 7 0 013 10zm7-9a9 9 0 100 18A9 9 0 0010 1z" clipRule="evenodd" opacity="0"/>
      {/* home grid */}
      <rect x="2" y="2" width="7" height="7" rx="1.5"/>
      <rect x="11" y="2" width="7" height="7" rx="1.5"/>
      <rect x="11" y="11" width="7" height="7" rx="1.5"/>
      <rect x="2" y="11" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  planning: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
    </svg>
  ),
  preco: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
    </svg>
  ),
  salaries: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
    </svg>
  ),
  candidats: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
    </svg>
  ),
  chiffres: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd"/>
    </svg>
  ),
  stats: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
    </svg>
  ),
  import: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
    </svg>
  ),
  export: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L10 11.586V3a1 1 0 112 0v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
    </svg>
  ),
};

// ─── Groupes de navigation ─────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Suivi",
    items: [
      { id: "dashboard", label: "Tableau de bord" },
      { id: "planning",  label: "Planning" },
      { id: "preco",     label: "Vue PRECO" },
    ],
  },
  {
    label: "Personnes",
    items: [
      { id: "salaries",  label: "Salariés" },
      { id: "candidats", label: "Candidats" },
    ],
  },
  {
    label: "Données",
    items: [
      { id: "chiffres", label: "Chiffres clés" },
      { id: "stats",    label: "Statistiques"  },
      { id: "import",   label: "Import"        },
      { id: "export",   label: "Export"        },
    ],
  },
];

// ─── Layout principal ─────────────────────────────────────────────────────────
export default function Layout({ user, children, page, setPage, onLogout, sites = [] }) {
  const th = getThemeForUser(user, sites);
  const logo = getLogoForUser(user, sites);

  // Initiales de l'utilisateur pour l'avatar
  const initials = `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase();

  const roleLabel = { admin: "Administrateur", direction: "Direction", cip: "CIP" }[user.role] ?? user.role;

  // "Chiffres clés" accessible admin + direction
  const chiffresItem = (user.role === "admin" || user.role === "direction")
    ? [{ id: "chiffres", label: "Chiffres clés" }]
    : [];
  // "Administration" accessible admin uniquement
  const adminItems = user.role === "admin"
    ? [{ id: "admin", label: "Administration" }]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ───────────────────────────────────────────────────────────── */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0 shadow-sm">

        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100">
          {logo}
        </div>

        {/* Navigation groupée */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.filter(item => {
                  // "Chiffres clés" visible uniquement pour admin et direction
                  if (item.id === "chiffres") return user.role === "admin" || user.role === "direction";
                  return true;
                }).map(item => {
                  const active = page === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setPage(item.id)}
                      style={active ? { backgroundColor: th.hex + "18", color: th.hex } : {}}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? "font-semibold"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      }`}
                    >
                      <span style={active ? { color: th.hex } : { color: "#9CA3AF" }} className="shrink-0 w-5 h-5 flex items-center justify-center">
                        {NAV_ICONS[item.id]}
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Administration (admin uniquement) */}
          {adminItems.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1.5">
                Système
              </p>
              {adminItems.map(item => {
                const active = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    style={active ? { backgroundColor: th.hex + "18", color: th.hex } : {}}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "font-semibold"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    }`}
                  >
                    <span style={active ? { color: th.hex } : { color: "#9CA3AF" }} className="shrink-0 w-5 h-5 flex items-center justify-center">
                      {NAV_ICONS[item.id]}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* Profil utilisateur */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 group">
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: th.hex }}
            >
              {initials}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">
                {user.prenom} {user.nom}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{roleLabel}</p>
            </div>
            {/* Logout */}
            <button
              onClick={onLogout}
              title="Déconnexion"
              className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h7a1 1 0 100-2H4V5h6a1 1 0 100-2H3zm10.293 4.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L14.586 11H8a1 1 0 110-2h6.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Contenu principal ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
