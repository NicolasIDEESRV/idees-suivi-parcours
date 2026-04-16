import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { LOGOS } from "../lib/logos";
import { FInput } from "../components/ui";

/**
 * Page affichée quand l'utilisateur clique sur son lien d'invitation.
 * Supabase redirige vers /#access_token=...&type=invite
 * Cette page récupère la session depuis le hash et demande un nouveau mot de passe.
 */
export default function SetPassword({ onDone }) {
  const [pw,      setPw]      = useState("");
  const [confirm, setConfirm] = useState("");
  const [err,     setErr]     = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready,   setReady]   = useState(false);

  // Supabase échange automatiquement le token du hash en session
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) {
        setReady(true);
      }
    });
  }, []);

  const handleSubmit = async () => {
    setErr("");
    if (!pw)            return setErr("Veuillez saisir un mot de passe.");
    if (pw.length < 8)  return setErr("Le mot de passe doit contenir au moins 8 caractères.");
    if (pw !== confirm)  return setErr("Les mots de passe ne correspondent pas.");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);

    if (error) return setErr(error.message);
    setSuccess(true);
    setTimeout(() => onDone?.(), 2000);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Mot de passe défini !</h2>
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
            <p className="text-sm text-gray-400">Définissez votre mot de passe pour accéder à l'application.</p>
          </div>
        </div>

        {!ready ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Vérification du lien…</p>
          </div>
        ) : (
          <div className="space-y-4">
            <FInput
              label="Nouveau mot de passe"
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="8 caractères minimum"
            />
            <FInput
              label="Confirmer le mot de passe"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
            {err && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {loading ? "Enregistrement…" : "Définir mon mot de passe"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
