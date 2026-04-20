import { useState, useEffect, useCallback } from "react";
import { getSites }       from "../lib/api/sites";
import { getProfiles }    from "../lib/api/profiles";
import { getSalaries, createSalarie, updateSalarie, sortirSalarie, deleteSalarie } from "../lib/api/salaries";
import { getEntretiens, saveEntretien, createJalons, confirmJalons } from "../lib/api/entretiens";
import { genJalons }      from "../lib/data";        // génère les jalons locaux avant persistance
import { supabase }       from "../lib/supabase";

/**
 * Hook principal de l'application.
 * Charge et synchronise toutes les données depuis Supabase.
 * Expose les handlers CRUD utilisés par App.jsx.
 *
 * @param {object|null} user - profil connecté (depuis AuthContext)
 */
export function useAppData(user) {
  const [sites,      setSites]      = useState([]);
  const [profiles,   setProfiles]   = useState([]);
  const [salaries,   setSalaries]   = useState([]);
  const [entretiens, setEntretiens] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // ── Chargement initial ───────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [s, p, sal, ent] = await Promise.all([
        getSites(),
        getProfiles(),
        getSalaries(),
        getEntretiens(),
      ]);
      setSites(s);
      setProfiles(p);
      setSalaries(sal);
      setEntretiens(ent);
    } catch (err) {
      console.error("useAppData — chargement :", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Realtime : synchronisation en direct ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("app-realtime")
      // Salariés
      .on("postgres_changes", { event: "*", schema: "public", table: "salaries" },
        () => getSalaries().then(setSalaries).catch(console.error))
      // Entretiens
      .on("postgres_changes", { event: "*", schema: "public", table: "entretiens" },
        () => getEntretiens().then(setEntretiens).catch(console.error))
      // Objectifs (changement → recharger les entretiens qui les contiennent)
      .on("postgres_changes", { event: "*", schema: "public", table: "objectifs" },
        () => getEntretiens().then(setEntretiens).catch(console.error))
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  // ════════════════════════════════════════════════════════════════════════════
  // HANDLERS CRUD
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Crée ou met à jour un salarié.
   * Après création, génère + persiste les 4 jalons obligatoires.
   * @returns {{ salarie, jalonsPersisted }} - le salarié sauvé + jalons créés (pour le modal)
   */
  const handleSaveSal = async (form) => {
    const isNew = !salaries.find(s => s.id === form.id);
    let saved;

    if (isNew) {
      saved = await createSalarie(form);
    } else {
      saved = await updateSalarie(form.id, form);
    }

    // Mise à jour locale immédiate
    setSalaries(prev =>
      isNew
        ? [...prev, saved]
        : prev.map(s => s.id === saved.id ? saved : s)
    );

    // Jalons obligatoires pour un nouveau salarié
    let jalonsPersisted = [];
    if (isNew) {
      const jalonsBruts = genJalons(saved.dateEntree, saved.id, saved.cip_id);
      jalonsPersisted   = await createJalons(jalonsBruts);
      setEntretiens(prev => [...prev, ...jalonsPersisted]);
    }

    return { salarie: saved, jalonsPersisted };
  };

  /**
   * Confirme les jalons après la modale (mise à jour date + assignedTo).
   * @param {object[]} jalons      - jalons avec leur id Supabase
   * @param {object}   confirmData - { [jalonId]: { date, assignedTo } }
   */
  const handleConfirmJalons = async (jalons, confirmData) => {
    await confirmJalons(jalons, confirmData);
    // Relecture locale
    const updated = await getEntretiens();
    setEntretiens(updated);
  };

  /**
   * Enregistre la sortie d'un salarié :
   *   - met à jour la fiche salarié
   *   - met à jour le bilan des objectifs (objBilan)
   */
  const handleSortie = async (salarie, form) => {
    // 1. Mettre à jour les objectifs du bilan final
    if (form.objBilan?.length) {
      await Promise.all(
        form.objBilan.map(o =>
          supabase
            .from("objectifs")
            .update({ atteint: o.atteint ?? null, commentaire: o.commentaire || null })
            .eq("id", o.id)
        )
      );
    }

    // 2. Mettre à jour le salarié
    const updated = await sortirSalarie(salarie.id, form);
    setSalaries(prev => prev.map(s => s.id === updated.id ? updated : s));

    // 3. Recharger les objectifs
    getEntretiens().then(setEntretiens).catch(console.error);

    return updated;
  };

  /**
   * Supprime définitivement un salarié (admin uniquement).
   * La cascade DB supprime aussi ses entretiens et objectifs.
   */
  const handleDeleteSalarie = async (salarieId) => {
    await deleteSalarie(salarieId);
    setSalaries(prev => prev.filter(s => s.id !== salarieId));
    setEntretiens(prev => prev.filter(e => e.salarie_id !== salarieId));
  };

  /**
   * Crée ou met à jour un entretien (+ ses objectifs + révisions).
   */
  const handleSaveEntretien = async (entretien) => {
    const saved = await saveEntretien(entretien);
    setEntretiens(prev => {
      const idx = prev.findIndex(e => e.id === saved.id);
      return idx >= 0
        ? prev.map(e => e.id === saved.id ? saved : e)
        : [...prev, saved];
    });
    return saved;
  };

  return {
    // Données
    sites,
    profiles,
    salaries,
    entretiens,
    loading,
    error,
    // Handlers
    handleSaveSal,
    handleConfirmJalons,
    handleSortie,
    handleDeleteSalarie,
    handleSaveEntretien,
    // Utilitaire
    reload: loadAll,
  };
}
