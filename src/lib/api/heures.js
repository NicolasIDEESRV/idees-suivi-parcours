import { supabase } from "../supabase";

/**
 * Récupère toutes les lignes heures_mensuelles pour une année donnée.
 */
export async function getHeuresMensuelles(annee) {
  const { data, error } = await supabase
    .from("heures_mensuelles")
    .select("*")
    .eq("annee", annee)
    .order("mois");
  if (error) throw error;
  return data;
}

/**
 * Insère ou met à jour une ligne heures_mensuelles (upsert sur site_id+annee+mois).
 */
export async function upsertHeuresMensuelles(row) {
  const { data, error } = await supabase
    .from("heures_mensuelles")
    .upsert(row, { onConflict: "site_id,annee,mois" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
