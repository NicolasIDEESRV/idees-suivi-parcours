export const fC = {
  "IDENTIFIÉ":         "bg-yellow-100 text-yellow-800",
  "À TRAITER":         "bg-orange-100 text-orange-800",
  "EN COURS":          "bg-blue-100 text-blue-800",
  "OK":                "bg-green-100 text-green-800",
  "TOUJOURS EXISTANT": "bg-red-100 text-red-800",
  "RÉSOLU":            "bg-green-200 text-green-900",
  "":                  "bg-gray-100 text-gray-400",
};

export const SITE_THEME = {
  s1:      { primary: "emerald", bg: "bg-emerald-600", light: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  s2:      { primary: "blue",    bg: "bg-blue-600",    light: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700" },
  default: { primary: "indigo",  bg: "bg-indigo-600",  light: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-700" },
};

export const getTheme = siteId => SITE_THEME[siteId] || SITE_THEME.default;
