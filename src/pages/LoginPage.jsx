import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { LOGOS } from "../lib/logos";
import { FInput } from "../components/ui";

export default function LoginPage() {
  const { signIn, authError } = useAuth();
  const [email,       setEmail]       = useState("");
  const [pw,          setPw]          = useState("");
  const [err,         setErr]         = useState("");
  const [load,        setLoad]        = useState(false);
  const [resetMode,   setResetMode]   = useState(false);
  const [resetSent,   setResetSent]   = useState(false);
  const [resetLoad,   setResetLoad]   = useState(false);

  const go = async () => {
    if (!email || !pw) { setErr("Veuillez renseigner l'email et le mot de passe."); return; }
    setLoad(true);
    setErr("");
    try {
      await signIn(email, pw);
    } catch (e) {
      setErr("Identifiants incorrects. Vérifiez votre email et mot de passe.");
    } finally {
      setLoad(false);
    }
  };

  const sendReset = async () => {
    if (!email.trim()) { setErr("Saisissez votre adresse email puis cliquez sur Réinitialiser."); return; }
    setResetLoad(true);
    setErr("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/?type=recovery`,
    });
    setResetLoad(false);
    if (error) {
      setErr("Impossible d'envoyer l'email. Vérifiez l'adresse saisie.");
    } else {
      setResetSent(true);
    }
  };

  // ── Mode : lien de réinitialisation envoyé ───────────────────────────────────
  if (resetSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">✉️</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Email envoyé</h2>
          <p className="text-sm text-gray-500">
            Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
            Vérifiez votre boîte de réception (et les spams).
          </p>
          <button onClick={() => { setResetSent(false); setResetMode(false); }}
            className="text-sm text-indigo-600 hover:underline">
            ← Retour à la connexion
          </button>
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
            <h1 className="text-lg font-bold text-gray-900">
              {resetMode ? "Mot de passe oublié" : "Connexion"}
            </h1>
            <p className="text-sm text-gray-400">
              {resetMode
                ? "Entrez votre email pour recevoir un lien de réinitialisation."
                : "Suivi socioprofessionnel"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <FInput
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (resetMode ? sendReset() : go())}
            autoComplete="email"
          />

          {!resetMode && (
            <FInput
              label="Mot de passe"
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && go()}
              autoComplete="current-password"
            />
          )}

          {(err || authError) && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err || authError}</p>
          )}

          {resetMode ? (
            <div className="space-y-2">
              <button onClick={sendReset} disabled={resetLoad}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                {resetLoad ? "Envoi…" : "Envoyer le lien de réinitialisation"}
              </button>
              <button onClick={() => { setResetMode(false); setErr(""); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2">
                ← Retour à la connexion
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button onClick={go} disabled={load}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                {load ? "Connexion…" : "Se connecter"}
              </button>
              <div className="text-center">
                <button onClick={() => { setResetMode(true); setErr(""); }}
                  className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
                  Mot de passe oublié ?
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
