import { getTheme } from "../lib/theme";
import { LOGOS } from "../lib/logos";

export default function Layout({ user, children, page, setPage, onLogout }) {
  const th = getTheme(user.site_id);
  const nav = [
    { id: "dashboard", icon: "⬛", label: "Tableau de bord" },
    { id: "planning",  icon: "📅", label: "Planning" },
    { id: "preco",     icon: "📋", label: "Vue PRECO" },
    { id: "salaries",  icon: "👥", label: "Salariés" },
    { id: "stats",     icon: "📊", label: "Statistiques" },
    { id: "import",    icon: "⬆", label: "Import" },
    { id: "export",    icon: "⬇", label: "Export" },
    ...(user.role === "admin" ? [{ id: "admin", icon: "⚙", label: "Admin" }] : []),
  ];
  const logo = user.role === "admin" ? LOGOS.groupe : (LOGOS[user.site_id] || LOGOS.groupe);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-52 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">{logo}</div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(n => (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                page === n.id ? `${th.bg} text-white` : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-base">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-semibold text-gray-700">{user.prenom} {user.nom}</p>
            <p className="text-xs text-gray-400">{user.role === "admin" ? "Administrateur" : "Conseiller"}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
          >
            Déconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
