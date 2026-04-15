import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LOGOS } from "../lib/logos";
import { FInput } from "../components/ui";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [pw,    setPw]    = useState("");
  const [err,   setErr]   = useState("");
  const [load,  setLoad]  = useState(false);

  const go = async () => {
    if (!email || !pw) { setErr("Veuillez renseigner l'email et le mot de passe."); return; }
    setLoad(true);
    setErr("");
    try {
      await signIn(email, pw);
      // La redirection est gérée par App.jsx via AuthContext (session change)
    } catch (e) {
      setErr("Identifiants incorrects. Vérifiez votre email et mot de passe.");
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        <div className="text-center mb-8">
          {LOGOS.groupe}
          <div className="mt-3">
            <h1 className="text-lg font-bold text-gray-900">Connexion</h1>
            <p className="text-sm text-gray-400">Suivi socioprofessionnel</p>
          </div>
        </div>
        <div className="space-y-4">
          <FInput
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && go()}
            autoComplete="email"
          />
          <FInput
            label="Mot de passe"
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && go()}
            autoComplete="current-password"
          />
          {err && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>
          )}
          <button
            onClick={go}
            disabled={load}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {load ? "Connexion…" : "Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
