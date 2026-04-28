// ════════════════════════════════════════════════════════════════════════════
// THÈME — couleurs primaires par filiale/site
// Couleurs officielles :
//   Groupe ID'EES   →  vert     #3AB54A
//   ID'EES R&V      →  lime     #8CC63F
//   ID'EES 21       →  magenta  #BE1875
// ════════════════════════════════════════════════════════════════════════════

export const fC = {
  "IDENTIFIÉ":         "bg-yellow-100 text-yellow-800",
  "À TRAITER":         "bg-orange-100 text-orange-800",
  "EN COURS":          "bg-blue-100 text-blue-800",
  "OK":                "bg-green-100 text-green-800",
  "TOUJOURS EXISTANT": "bg-red-100 text-red-800",
  "RÉSOLU":            "bg-green-200 text-green-900",
  "":                  "bg-gray-100 text-gray-400",
};

// Thème par site_id (valeurs statiques pour sites connus)
export const SITE_THEME = {
  // ID'EES R&V → lime
  s1: {
    primary:   "#8CC63F",
    bg:        "bg-[#8CC63F]",
    bgHover:   "hover:bg-[#7db236]",
    light:     "bg-[#f4fae6]",
    border:    "border-[#8CC63F]",
    text:      "text-[#5a8520]",
    ring:      "focus:ring-[#8CC63F]/30",
    hex:       "#8CC63F",
  },
  // ID'EES Logistique → vert groupe (à affiner si ID'EES 21)
  s2: {
    primary:   "#BE1875",
    bg:        "bg-[#BE1875]",
    bgHover:   "hover:bg-[#a81566]",
    light:     "bg-[#fdf0f7]",
    border:    "border-[#BE1875]",
    text:      "text-[#BE1875]",
    ring:      "focus:ring-[#BE1875]/30",
    hex:       "#BE1875",
  },
  // Défaut (admin/groupe)
  default: {
    primary:   "#3AB54A",
    bg:        "bg-[#3AB54A]",
    bgHover:   "hover:bg-[#2fa040]",
    light:     "bg-[#edf9ef]",
    border:    "border-[#3AB54A]",
    text:      "text-[#3AB54A]",
    ring:      "focus:ring-[#3AB54A]/30",
    hex:       "#3AB54A",
  },
};

export const getTheme = (siteId) => SITE_THEME[siteId] || SITE_THEME.default;

/**
 * Retourne le thème en fonction des filiales (détection par nom).
 * Utile quand on a un objet `site` complet avec sa filiale.
 */
export const getThemeByFiliale = (filiale = "") => {
  if (filiale.includes("R&V"))          return SITE_THEME.s1;
  if (filiale.includes("21"))           return SITE_THEME.s2;
  return SITE_THEME.default;
};

/**
 * Retourne le thème pour un utilisateur en tenant compte de son/ses sites.
 */
export const getThemeForUser = (user, sites = []) => {
  if (user.role === "admin") return SITE_THEME.default;
  const siteId = user.site_ids?.[0] ?? user.site_id;
  return getTheme(siteId);
};
