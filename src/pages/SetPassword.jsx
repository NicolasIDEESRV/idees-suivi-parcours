import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { LOGOS } from "../lib/logos";
import { FInput } from "../components/ui";

// ─── Règles de complexité du mot de passe ────────────────────────────────────
const PW_RULES = [
  { id: "len",     label: "12 caractères minimum",       test: pw => pw.length >= 12 },
  { id: "upper",   label: "Une lettre majuscule (A-Z)",   test: pw => /[A-Z]/.test(pw) },
  { id: "digit",   label: "Un chiffre (0-9)",             test: pw => /[0-9]/.test(pw) },
  { id: "special", label: "Un caractère spécial (!@#…)",  test: pw => /[^A-Za-z0-9]/.test(pw) },
];

function PasswordStrength({ pw }) {
  if (!pw) return null;
  const passed  = PW_RULES.filter(r => r.test(pw)).length;
  const pct     = Math.round((passed / PW_RULES.length) * 100);
  const color   = passed <= 1 ? "bg-red-400"    : passed === 2 ? "bg-orange-400"
                : passed === 3 ? "bg-yellow-400" : "bg-green-500";
  const label   = passed <= 1 ? "Faible" : passed === 2 ? "Moyen"
                : passed === 3 ? "Bon"    : "Fort";
  const txtCol  = passed <= 1 ? "text-red-600"    : passed === 2 ? "text-orange-600"
                : passed === 3 ? "text-yellow-600" : "text-green-600";

  return (
    <div className="space-y-2">
      {/* Barre de force */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${color}`}
               style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-xs font-semibold ${txtCol}`}>{label}</span>
      </div>
      {/* Liste des règles */}
      <ul className="space-y-0.5">
        {PW_RULES.map(r => {
          const ok = r.test(pw);
          return (
            <li key={r.id} className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-600" : "text-gray-400"}`}>
              <span>{ok ? "✓" : "·"}</span>
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function validatePassword(pw) {
  const failed = PW_RULES.filter(r => !r.test(pw));
  if (failed.length === 0) return null;
  return `Mot de passe insuffisant — manque : ${failed.map(r => r.label.toLowerCase()).join(", ")}.`;
}

/**
 * Page affichée quand l'utilisateur clique sur son lien d'invitation.
 * - Attend la session Supabase (échange PKCE du ?code=)
 * - Demande prénom, nom et mot de passe
 * - Appelle complete_my_profile (SECURITY DEFINER) pour créer le profil
 *   avec le rôle défini par l'admin à l'invitation
 * - Redirige vers l'app
 */
export default function SetPassword({ onDone }) {
  const [prenom,  setPrenom]  = useState("");
  const [nom,     setNom]     = useState("");
  const [pw,      setPw]      = useState("");
  const [confirm, setConfirm] = useState("");
  const [err,     setErr]     = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready,   setReady]   = useState(false);

  // Supabase échange automatiquement le token / code en session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    setErr("");
    if (!prenom.trim()) return setErr("Veuillez saisir votre prénom.");
    if (!nom.trim())    return setErr("Veuillez saisir votre nom.");
    if (!pw)            return setErr("Veuillez saisir un mot de passe.");
    const pwErr = validatePassword(pw);
    if (pwErr)          return setErr(pwErr);
    if (pw !== confirm) return setErr("Les mots de passe ne correspondent pas.");

    setLoading(true);

    try {
      // 1. Définir le mot de passe
      const { error: pwErr } = await supabase.auth.updateUser({ password: pw });
      if (pwErr) throw pwErr;

      // 2. Créer/compléter le profil (rôle lu depuis les métadonnées côté DB)
      const { error: profileErr } = await supabase.rpc("complete_my_profile", {
        p_nom:    nom.trim(),
        p_prenom: prenom.trim(),
      });
      if (profileErr) throw profileErr;

      setSuccess(true);
      setTimeout(() => onDone?.(), 2000);
    } catch (e) {
      // Message lisible pour l'utilisateur
      if (e?.message?.includes("site non défini")) {
        setErr("Votre invitation n'est pas correctement configurée (site manquant). Contactez votre administrateur.");
      } else {
        setErr(e?.message ?? "Une erreur est survenue. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Compte activé !</h2>
          <p className="text-sm text-gray-400">Redirection vers l'application…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        <div className="text-center mb-8">
          {LOGOS.groupe}
          <div className="mt-3">
            <h1 className="text-lg font-bold text-gray-900">Bienvenue !</h1>
            <p className="text-sm text-gray-400">Finalisez votre compte pour accéder à l'application.</p>
          </div>
        </div>

        {!ready ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Vérification du lien…</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FInput
                label="Prénom"
                required
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                autoComplete="given-name"
              />
              <FInput
                label="Nom"
                required
                value={nom}
                onChange={e => setNom(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                autoComplete="family-name"
              />
            </div>
            <div className="space-y-2">
              <FInput
                label="Mot de passe"
                required
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="12 caractères minimum"
                autoComplete="new-password"
              />
              <PasswordStrength pw={pw} />
            </div>
            <FInput
              label="Confirmer le mot de passe"
              required
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              autoComplete="new-password"
            />
            {err && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {loading ? "Activation…" : "Activer mon compte"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
