import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getMyProfile } from "../lib/api/profiles";

// ─── Contexte ─────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

/**
 * Fournit la session Supabase et le profil applicatif (rôle, site…).
 * À placer au plus haut niveau de l'arbre React.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = chargement initial
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [authError, setAuthError] = useState(null);

  // ── Chargement initial + écoute des changements de session ──────────────────
  useEffect(() => {
    // Session courante
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Abonnement aux événements Auth (login, logout, refresh token…)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) setProfile(null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Chargement du profil applicatif dès qu'une session est disponible ───────
  useEffect(() => {
    if (!session) return;
    setLoadingProfile(true);
    setAuthError(null);
    getMyProfile()
      .then(setProfile)
      .catch(err => {
        console.error("Erreur chargement profil :", err.message);
        setAuthError(err.message);
      })
      .finally(() => setLoadingProfile(false));
  }, [session?.user?.id]);

  // ── Connexion email / mot de passe ───────────────────────────────────────────
  const signIn = async (email, password) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  // ── Déconnexion ───────────────────────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const value = {
    session,
    profile,          // profil applicatif : { id, nom, prenom, email, role, site_id }
    user: profile,    // alias pratique utilisé dans les composants existants
    loading: session === undefined || loadingProfile,
    authError,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook pour consommer le contexte Auth dans n'importe quel composant. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
