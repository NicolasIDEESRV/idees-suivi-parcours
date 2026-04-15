import { supabase } from "../supabase";
import { mapSiteFromDB } from "../mappers";

/** Récupère tous les sites actifs (visibles par tous les rôles). */
export async function getSites() {
  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("actif", true)
    .order("nom");
  if (error) throw error;
  return data.map(mapSiteFromDB);
}
