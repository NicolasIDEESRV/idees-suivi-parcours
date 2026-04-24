export const todayStr = new Date().toISOString().split("T")[0];

export const addDays = (d, n) => {
  const r = new Date(d || todayStr);
  r.setDate(r.getDate() + n);
  return r.toISOString().split("T")[0];
};

export const fmt = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

export const getAge = dn => {
  if (!dn) return null;
  const d = new Date(dn), n = new Date();
  return n.getFullYear() - d.getFullYear() - (n < new Date(n.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
};

export const dureeM = (e, s) => {
  if (!e) return 0;
  const d1 = new Date(e), d2 = s ? new Date(s) : new Date();
  return Math.max(0, (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()));
};

export const daysUntil = d => {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / (864e5));
};

export const urgC = days => {
  if (days === null || days === undefined) return "text-gray-400 bg-gray-50 border-gray-100";
  if (days < 0)   return "text-red-700 bg-red-50 border-red-200";
  if (days <= 30) return "text-orange-700 bg-orange-50 border-orange-200";
  if (days <= 60) return "text-yellow-700 bg-yellow-50 border-yellow-200";
  return "text-green-700 bg-green-50 border-green-200";
};

/**
 * Retourne la liste des site_id accessibles par cet utilisateur :
 *  - admin     → null (pas de filtre, accès à tout)
 *  - direction → tous les sites listés dans user.site_ids
 *  - cip       → tous les sites listés dans user.site_ids
 *
 * Note : site_ids est prioritaire sur l'ancien champ site_id (mono-site).
 */
export function getScopeIds(user, _sites) {
  if (user.role === "admin") return null;
  // Utilise le tableau multi-sites s'il est renseigné
  if (Array.isArray(user.site_ids) && user.site_ids.length > 0) return user.site_ids;
  // Fallback sur l'ancien champ mono-site
  return user.site_id ? [user.site_id] : [];
}
