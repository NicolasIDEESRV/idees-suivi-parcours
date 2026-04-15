import { supabase } from "../supabase";
import { mapProfileFromDB } from "../mappers";

/**
 * Profil de l'utilisateur connecté.
 * Appelle auth.getUser() puis charge le profil correspondant.
 */
export async function getMyProfile() {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw authErr ?? new Error("Non authentifié");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return mapProfileFromDB(data);
}

/**
 * Liste des profiles visibles selon le RLS :
 *   - admin/direction → tous
 *   - cip             → son site uniquement
 */
export async function getProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("actif", true)
    .order("nom");
  if (error) throw error;
  return data.map(mapProfileFromDB);
}

/** Mise à jour du profil (admin peut modifier n'importe qui, les autres seulement le leur). */
export async function updateProfile(id, patch) {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapProfileFromDB(data);
}
