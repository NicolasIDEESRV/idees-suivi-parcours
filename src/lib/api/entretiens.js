import { supabase } from "../supabase";
import { mapEntretienFromDB, mapEntretienToDB, mapObjectifToDB } from "../mappers";

/**
 * Récupère tous les entretiens avec leurs objectifs (jointure).
 * Le RLS filtre automatiquement selon le site de l'utilisateur.
 */
export async function getEntretiens() {
  const { data, error } = await supabase
    .from("entretiens")
    .select("*, objectifs(*)")
    .order("date", { ascending: false });
  if (error) throw error;
  return data.map(mapEntretienFromDB);
}

/**
 * Crée ou met à jour un entretien, puis gère ses objectifs :
 *   1. Upsert de l'entretien
 *   2. Upsert de chaque objectif lié
 *   3. Mise à jour des objectifs révisés (atteint / commentaire)
 *
 * @param {object} entretien - objet JS (camelCase) avec champ `objectifs[]` et optionnel `objectifsRevus[]`
 * @returns {object} entretien JS mis à jour avec ses objectifs
 */
export async function saveEntretien(entretien) {
  const { objectifs = [], objectifsRevus = [], ...rest } = entretien;

  // ── 1. Upsert de l'entretien ──────────────────────────────────────────────
  const payload = mapEntretienToDB(rest);

  let savedId = rest.id;
  if (savedId) {
    // Mise à jour
    const { error } = await supabase
      .from("entretiens")
      .update(payload)
      .eq("id", savedId);
    if (error) throw error;
  } else {
    // Création
    const { data, error } = await supabase
      .from("entretiens")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    savedId = data.id;
  }

  // ── 2. Upsert des objectifs de cet entretien ──────────────────────────────
  for (const obj of objectifs) {
    if (!obj.intitule) continue;
    const objPayload = mapObjectifToDB(obj, savedId, rest.salarie_id);
    if (obj.id && !obj.id.startsWith("ob")) {
      // id UUID réel → update
      await supabase.from("objectifs").update(objPayload).eq("id", obj.id);
    } else {
      // id temporaire local → insert
      await supabase.from("objectifs").insert(objPayload);
    }
  }

  // ── 3. Révision des objectifs existants (bilan) ───────────────────────────
  for (const obj of objectifsRevus) {
    if (!obj.id || obj.id.startsWith("ob")) continue; // id temporaire, ignoré
    await supabase
      .from("objectifs")
      .update({
        atteint:     obj.atteint     ?? null,
        commentaire: obj.commentaire || null,
      })
      .eq("id", obj.id);
  }

  // ── 4. Relecture complète ─────────────────────────────────────────────────
  const { data, error } = await supabase
    .from("entretiens")
    .select("*, objectifs(*)")
    .eq("id", savedId)
    .single();
  if (error) throw error;
  return mapEntretienFromDB(data);
}

/**
 * Insère en lot les jalons générés à l'inscription d'un nouveau salarié.
 * @param {object[]} jalons - tableau d'objets JS (camelCase)
 * @returns {object[]} jalons créés (JS)
 */
export async function createJalons(jalons) {
  const payloads = jalons.map(j => ({
    ...mapEntretienToDB(j),
    // Les jalons n'ont pas d'id local valide : on laisse Supabase en générer un
  }));
  const { data, error } = await supabase
    .from("entretiens")
    .insert(payloads)
    .select("*, objectifs(*)");
  if (error) throw error;
  return data.map(mapEntretienFromDB);
}

/**
 * Confirme les jalons (date + assignedTo) après validation du modal.
 * @param {object[]} jalons        - jalons avec leur id Supabase
 * @param {object}   confirmData   - { [jalonId]: { date, assignedTo } }
 */
export async function confirmJalons(jalons, confirmData) {
  const updates = jalons.map(j => {
    const d = confirmData[j.id];
    return supabase
      .from("entretiens")
      .update({
        date:            d.date,
        assigned_to:     d.assignedTo,
        jalon_confirmed: true,
      })
      .eq("id", j.id);
  });
  const results = await Promise.all(updates);
  const firstErr = results.find(r => r.error);
  if (firstErr) throw firstErr.error;
}
