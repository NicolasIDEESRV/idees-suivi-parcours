import { useState } from "react";
import { useAuth }     from "./contexts/AuthContext";
import { AUTH_CALLBACK_TYPE } from "./lib/supabase";
import { useAppData }  from "./hooks/useAppData";
import { newSal }      from "./lib/data";
import Layout          from "./components/Layout";
import JalonConfirmModal        from "./components/JalonConfirmModal";
import FormulaireNouveauSalarie from "./components/FormulaireNouveauSalarie";
import FormulaireSortie         from "./components/FormulaireSortie";
import LoginPage    from "./pages/LoginPage";
import SetPassword  from "./pages/SetPassword";
import Dashboard    from "./pages/Dashboard";
import Planning     from "./pages/Planning";
import FicheSalarie from "./pages/FicheSalarie";
import VuePreco     from "./pages/VuePreco";
import ListeSalaries from "./pages/ListeSalaries";
import Candidats     from "./pages/Candidats";
import Stats        from "./pages/Stats";
import Import       from "./pages/Import";
import Export       from "./pages/Export";
import Admin        from "./pages/Admin";


// ─── Écran de chargement ──────────────────────────────────────────────────────
function Loader({ message = "Chargement…" }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

// ─── Écran d'erreur data ──────────────────────────────────────────────────────
function DataError({ message, onRetry }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-8">
      <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm max-w-md text-center">
        ⚠ Erreur de chargement : {message}
      </p>
      <button onClick={onRetry} className="text-sm text-indigo-600 hover:underline">
        Réessayer
      </button>
    </div>
  );
}

// ─── App principale (utilisateur connecté) ────────────────────────────────────
function AppInner({ user, onLogout }) {
  const {
    sites, profiles, salaries, entretiens,
    loading, error,
    handleSaveSal, handleConfirmJalons, handleSortie, handleDeleteSalarie, handleDeleteManySalaries, handleSaveEntretien,
    reload,
  } = useAppData(user);

  const [page,       setPage]       = useState("dashboard");
  const [sel,        setSel]        = useState(null);
  const [showNew,      setShowNew]      = useState(false);
  const [showNewCand,  setShowNewCand]  = useState(false);
  const [editSal,      setEditSal]      = useState(null);
  const [sortSal,      setSortSal]      = useState(null);
  const [jalonModal,   setJalonModal]   = useState(null); // { jalons[] }
  const [convertCand,  setConvertCand]  = useState(null); // candidat à convertir

  const navigate = (p, s = null) => { if (s) setSel(s); setPage(p); };

  // ── Sauvegarde salarié ───────────────────────────────────────────────────────
  const onSaveSal = async (form) => {
    try {
      const { salarie, jalonsPersisted } = await handleSaveSal(form);
      setShowNew(false);
      setShowNewCand(false);
      setEditSal(null);
      if (page === "fiche") setSel(salarie);
      if (jalonsPersisted.length > 0) {
        setJalonModal({ jalons: jalonsPersisted });
      }
    } catch (e) {
      alert("Erreur lors de l'enregistrement : " + e.message);
    }
  };

  // ── Confirmation jalons ──────────────────────────────────────────────────────
  const onConfirmJalons = async (confirmData) => {
    try {
      await handleConfirmJalons(jalonModal.jalons, confirmData);
      setJalonModal(null);
    } catch (e) {
      alert("Erreur jalons : " + e.message);
    }
  };

  // ── Sortie salarié ───────────────────────────────────────────────────────────
  const onSortie = async (form) => {
    try {
      const updated = await handleSortie(sortSal, form);
      setSortSal(null);
      if (sel?.id === updated.id) setSel(updated);
    } catch (e) {
      alert("Erreur sortie : " + e.message);
    }
  };

  // ── Entretien ────────────────────────────────────────────────────────────────
  const onSaveEntretien = async (entretien) => {
    try {
      await handleSaveEntretien(entretien);
    } catch (e) {
      alert("Erreur entretien : " + e.message);
    }
  };

  if (loading) return <Loader message="Chargement des données…" />;
  if (error)   return <DataError message={error} onRetry={reload} />;

  return (
    <Layout
      user={user}
      sites={sites}
      page={page === "fiche" ? (sel?.isCandidat ? "candidats" : "salaries") : page}
      setPage={navigate}
      onLogout={onLogout}
    >
      {/* ── Modal confirmation jalons ── */}
      {jalonModal && (
        <JalonConfirmModal
          jalons={jalonModal.jalons}
          users={profiles}
          onConfirm={onConfirmJalons}
          onClose={() => setJalonModal(null)}
        />
      )}

      {/* ── Conversion candidat → salarié ── */}
      {convertCand && (
        <FormulaireNouveauSalarie
          initial={{ ...convertCand, isCandidat: false }}
          sites={sites}
          user={user}
          onSave={async (form) => {
            await onSaveSal(form);
            setConvertCand(null);
          }}
          onClose={() => setConvertCand(null)}
        />
      )}

      {/* ── Formulaire nouveau / édition salarié ── */}
      {(showNew || editSal) && (
        <FormulaireNouveauSalarie
          initial={editSal}
          sites={sites}
          user={user}
          onSave={onSaveSal}
          onClose={() => { setShowNew(false); setEditSal(null); }}
        />
      )}

      {/* ── Formulaire nouveau candidat ── */}
      {showNewCand && (
        <FormulaireNouveauSalarie
          initial={newSal({ site_id: user.site_id, cip_id: user.id, isCandidat: true, dateEntree: "" })}
          sites={sites}
          user={user}
          onSave={onSaveSal}
          onClose={() => setShowNewCand(false)}
        />
      )}

      {/* ── Formulaire sortie ── */}
      {sortSal && (
        <FormulaireSortie
          salarie={sortSal}
          entretiens={entretiens}
          onSave={onSortie}
          onClose={() => setSortSal(null)}
        />
      )}

      {/* ── Pages ── */}
      {page === "dashboard" && (
        <Dashboard
          user={user} salaries={salaries} entretiens={entretiens} sites={sites}
          setPage={navigate} setSelectedSalarie={setSel}
        />
      )}
      {page === "planning" && (
        <Planning
          user={user} salaries={salaries} sites={sites} entretiens={entretiens}
          users={profiles} setPage={navigate} setSelectedSalarie={setSel}
        />
      )}
      {page === "preco" && (
        <VuePreco
          user={user} salaries={salaries} sites={sites} entretiens={entretiens}
          setPage={navigate} setSelectedSalarie={setSel} onOpenSortie={setSortSal}
        />
      )}
      {page === "salaries" && (
        <ListeSalaries
          user={user} salaries={salaries} sites={sites}
          setPage={navigate} setSelectedSalarie={setSel}
          onNew={() => setShowNew(true)} onOpenSortie={setSortSal}
          onDeleteMany={handleDeleteManySalaries}
        />
      )}
      {page === "fiche" && sel && (
        <FicheSalarie
          salarie={sel} entretiens={entretiens} user={user} users={profiles}
          setPage={navigate}
          onEdit={s => setEditSal(s)}
          onAddEntretien={onSaveEntretien}
          onOpenSortie={setSortSal}
          onDelete={async (id) => {
            await handleDeleteSalarie(id);
            navigate("salaries");
          }}
        />
      )}
      {page === "candidats" && (
        <Candidats
          user={user} salaries={salaries} sites={sites}
          setPage={navigate} setSelectedSalarie={setSel}
          onNew={() => setShowNewCand(true)}
          onDeleteMany={handleDeleteManySalaries}
          onConvertToSalarie={setConvertCand}
        />
      )}
      {page === "stats" && (
        <Stats user={user} salaries={salaries} sites={sites} />
      )}
      {page === "import" && (
        <Import user={user} sites={sites} />
      )}
      {page === "export" && (
        <Export
          user={user} salaries={salaries} entretiens={entretiens}
          sites={sites} profiles={profiles}
        />
      )}
      {page === "admin" && (
        <Admin user={user} sites={sites} />
      )}
    </Layout>
  );
}

// ─── Racine ───────────────────────────────────────────────────────────────────
export default function App() {
  const { user, loading, signOut } = useAuth();

  // Lien d'invitation cliqué → afficher le formulaire "définir mon mot de passe"
  if (AUTH_CALLBACK_TYPE) {
    return (
      <SetPassword onDone={() => {
        // Nettoie le hash et recharge l'app normalement
        window.history.replaceState(null, "", window.location.pathname);
        window.location.reload();
      }} />
    );
  }

  // Chargement Auth initial (vérification de la session persistée)
  if (loading) return <Loader />;

  // Non authentifié → page de connexion
  if (!user) return <LoginPage />;

  // Authentifié → app complète
  return <AppInner user={user} onLogout={signOut} />;
}
