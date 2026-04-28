// ─── SVG Logo Mark ────────────────────────────────────────────────────────────
// Reproduit le monogramme "iD" avec le point coloré et les chevrons

function IdMark({ color = "#3AB54A", size = 36 }) {
  const dark = "#2B2B2B";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Dot of i */}
      <circle cx="19" cy="13" r="11" fill={color} />
      {/* i stem */}
      <rect x="12" y="29" width="14" height="38" rx="2" fill={dark} />
      {/* D body */}
      <path d="M33 8 L33 76 L55 76 Q84 76 84 42 Q84 8 55 8 Z" fill={dark} />
      {/* D inner cutout */}
      <path d="M47 22 L55 22 Q68 22 68 42 Q68 62 55 62 L47 62 Z" fill="white" />
      {/* Diagonal accent lines (chevrons) */}
      <path d="M47 68 L84 50 L84 57 L47 75 Z" fill={color} />
      <path d="M47 78 L84 60 L84 67 L47 85 Z" fill={color} />
    </svg>
  );
}

// ─── Logo complet (mark + texte) ─────────────────────────────────────────────

export function LogoGroupe({ compact = false }) {
  const color = "#3AB54A";
  return (
    <div className="flex items-center gap-2.5">
      <IdMark color={color} size={compact ? 28 : 36} />
      <div className="leading-none">
        <p className="text-sm font-black tracking-tight" style={{ color: "#2B2B2B" }}>
          <span style={{ color }}>GROUPE</span>
        </p>
        <p className="text-sm font-black tracking-tight" style={{ color: "#2B2B2B" }}>ID&apos;EES</p>
      </div>
    </div>
  );
}

export function LogoRV({ compact = false }) {
  const color = "#8CC63F";
  return (
    <div className="flex items-center gap-2.5">
      <IdMark color={color} size={compact ? 28 : 36} />
      <div className="leading-none">
        <p className="text-sm font-black tracking-tight" style={{ color: "#2B2B2B" }}>ID&apos;EES</p>
        <p className="text-sm font-black tracking-tight" style={{ color }}>R&amp;V</p>
      </div>
    </div>
  );
}

export function Logo21({ compact = false }) {
  const color = "#BE1875";
  return (
    <div className="flex items-center gap-2.5">
      <IdMark color={color} size={compact ? 28 : 36} />
      <div className="leading-none">
        <p className="text-sm font-black tracking-tight" style={{ color: "#2B2B2B" }}>ID&apos;EES</p>
        <p className="text-sm font-black tracking-tight" style={{ color }}>21</p>
      </div>
    </div>
  );
}

// ─── Export legacy LOGOS (pour compatibilité LoginPage / SetPassword) ────────
export const LOGOS = {
  groupe: <LogoGroupe />,
  s1:     <LogoRV />,
  s2:     <Logo21 />,
};

// ─── Map site_id → logo ───────────────────────────────────────────────────────
// Adapté dynamiquement selon les filiales réelles en DB
// Pour l'instant on mappe sur les filiales connues

export function getLogoForUser(user, sites = []) {
  if (user.role === "admin") return <LogoGroupe />;

  // Prendre le premier site de l'utilisateur et déduire la filiale
  const siteId = user.site_ids?.[0] ?? user.site_id;
  const site = sites.find(s => s.id === siteId);
  const filiale = site?.filiale ?? "";

  if (filiale.includes("R&V") || filiale.includes("R&amp;V")) return <LogoRV />;
  if (filiale.includes("21"))   return <Logo21 />;
  if (filiale.includes("LOG"))  return <LogoGroupe />;
  return <LogoGroupe />;
}
