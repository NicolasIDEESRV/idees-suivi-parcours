import { supabase } from "../supabase";
import { mapSalarieFromDB, mapSalarieToDB, mapCandidatToDB } from "../mappers";

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
 * Crée un nouveau salarié OU candidat.
 * Utilise un mapper allégé pour les candidats (évite les NOT NULL sur les colonnes contrat).
 */
export async function createSalarie(form) {
  const payload = form.isCandidat ? mapCandidatToDB(form) : mapSalarieToDB(form);
  const { data, error } = await supabase
    .from("salaries")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return mapSalarieFromDB(data);
}

/**
 * Met à jour un salarié ou candidat existant.
 * Pour les candidats, utilise le mapper allégé.
 */
export async function updateSalarie(id, form) {
  const payload = form.isCandidat ? mapCandidatToDB(form) : mapSalarieToDB(form);
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
 * Enregistre la sortie d'un salarié :
 * - Met à jour date_sortie + champs bilan
 * - Calcule rappel_jusqu_au = date_sortie + 3 mois
 * - Supprime tous les entretiens futurs (date > date_sortie) via RPC
 */
export async function sortirSalarie(id, sortieForm) {
  const dateSortie = sortieForm.dateSortie || null;

  // Calculer la date limite du rappel (sortie + 3 mois)
  let rappelJusquAu = null;
  if (dateSortie && sortieForm.aRappeler) {
    const d = new Date(dateSortie);
    d.setMonth(d.getMonth() + 3);
    rappelJusquAu = d.toISOString().split("T")[0];
  }

  const payload = {
    date_sortie:          dateSortie,
    type_sortie:          sortieForm.typeSortie         || null,
    situation_sortie:     sortieForm.situationSortie     || null,
    accord_suivi_post:    sortieForm.accordSuiviPost     ?? false,
    accord_transmission:  sortieForm.accordTransmission  ?? false,
    a_rappeler:           sortieForm.aRappeler           ?? false,
    rappel_jusqu_au:      rappelJusquAu,
    synth_besoins_sortie: sortieForm.synthBesoinsSortie  || null,
    synth_parcours:       sortieForm.synthParcours       || null,
    freins_sortie:        sortieForm.freinsSortie        ?? {},
  };

  const { data, error } = await supabase
    .from("salaries")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  // Supprimer les entretiens futurs (après date de sortie)
  if (dateSortie) {
    await supabase.rpc("nettoyer_echeances_sortie", {
      p_salarie_id: id,
      p_date_sortie: dateSortie,
    });
  }

  return mapSalarieFromDB(data);
}

/**
 * Vérifie que le numéro de sécurité sociale est unique (toutes filiales confondues).
 * Retourne les doublons trouvés (tableau vide = unique).
 * Chaque doublon contient : id, nom, prenom, is_candidat, site_id, date_entree, date_sortie
 * → date_sortie IS NULL = personne encore active ; IS NOT NULL = ancienne fiche
 */
// Vérifie qu'un string est un UUID valide (format Supabase)
const isUUID = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export async function checkNumSecuUnique(numSecu, excludeId = null) {
  if (!numSecu || !numSecu.trim()) return [];
  let q = supabase
    .from("salaries")
    .select("id, nom, prenom, is_candidat, site_id, date_entree, date_sortie")
    .eq("num_secu_sociale", numSecu.trim());
  if (excludeId && isUUID(excludeId)) q = q.neq("id", excludeId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

/**
 * Récupère une fiche complète par son ID (pour pré-remplissage lors de la récupération).
 */
export async function getSalarieById(id) {
  if (!id || !isUUID(id)) return null;
  const { data, error } = await supabase
    .from("salaries")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return mapSalarieFromDB(data);
}

/**
 * Supprime définitivement un salarié et toutes ses données (admin uniquement).
 * La suppression en cascade (entretiens, objectifs) est gérée par la DB.
 */
export async function deleteSalarie(id) {
  const { error } = await supabase.rpc("supprimer_salarie", { p_salarie_id: id });
  if (error) throw error;
}
