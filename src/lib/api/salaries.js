import { supabase } from "../supabase";
import { mapSalarieFromDB, mapSalarieToDB } from "../mappers";

/**
 * Récupère tous les salariés visibles (RLS appliqué automatiquement) :
 *   - admin/direction → tous sites
 *   - cip             → son site uniquement
 */
export async function getSalaries() {
  const { data, error } = await supabase
    .from("salaries")
    .select("*")
    .order("nom");
  if (error) throw error;
  return data.map(mapSalarieFromDB);
}

/**
 * Crée un nouveau salarié.
 * Retourne l'objet JS mappé (avec l'id UUID généré par Supabase).
 */
export async function createSalarie(form) {
  const payload = mapSalarieToDB(form);
  const { data, error } = await supabase
    .from("salaries")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return mapSalarieFromDB(data);
}

/**
 * Met à jour un salarié existant.
 */
export async function updateSalarie(id, form) {
  const payload = mapSalarieToDB(form);
  const { data, error } = await supabase
    .from("salaries")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapSalarieFromDB(data);
}

/**
 * Enregistre la sortie d'un salarié (met à jour date_sortie + champs bilan).
 */
export async function sortirSalarie(id, sortieForm) {
  const payload = {
    date_sortie:         sortieForm.dateSortie         || null,
    type_sortie:         sortieForm.typeSortie         || null,
    situation_sortie:    sortieForm.situationSortie     || null,
    accord_suivi_post:   sortieForm.accordSuiviPost     ?? false,
    accord_transmission: sortieForm.accordTransmission  ?? false,
    a_rappeler:          sortieForm.aRappeler           ?? false,
    synth_besoins_sortie: sortieForm.synthBesoinsSortie || null,
    synth_parcours:       sortieForm.synthParcours      || null,
    freins_sortie:        sortieForm.freinsSortie       ?? {},
  };
  const { data, error } = await supabase
    .from("salaries")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapSalarieFromDB(data);
}
