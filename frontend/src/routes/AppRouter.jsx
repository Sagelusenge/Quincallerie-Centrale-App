import { Navigate, Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '../components/layout/MainLayout.jsx';
import { Loader } from '../components/ui/Loader.jsx';
import { setupApi } from '../api/setupApi.js';
import { SetupPage } from '../features/setup/SetupPage.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { ProtectedRoute } from '../features/auth/ProtectedRoute.jsx';
import { RequireRole } from '../features/auth/RequireRole.jsx';
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx';
import { ClientsPage } from '../features/clients/ClientsPage.jsx';
import { CategoriesPage } from '../features/categories/CategoriesPage.jsx';
import { ProduitsPage } from '../features/produits/ProduitsPage.jsx';
import { StockPage } from '../features/stock/StockPage.jsx';
import { FournisseursPage } from '../features/fournisseurs/FournisseursPage.jsx';
import { ProduitsStockPage } from '../features/produitsStock/ProduitsStockPage.jsx';
import { PaniersPage } from '../features/paniers/PaniersPage.jsx';
import { VentesPage } from '../features/ventes/VentesPage.jsx';
import { VenteDetailsPage } from '../features/ventes/VenteDetailsPage.jsx';
import { PaiementsPage } from '../features/paiements/PaiementsPage.jsx';
import { RapportsPage } from '../features/rapports/RapportsPage.jsx';
import { UtilisateursPage } from '../features/utilisateurs/UtilisateursPage.jsx';
import { NotificationsPage } from '../features/notifications/NotificationsPage.jsx';
import { MailPage } from '../features/mail/MailPage.jsx';

function StartupRedirect() {
  const setup = useQuery({ queryKey: ['setup', 'status'], queryFn: setupApi.status, retry: false });

  if (setup.isLoading) return <Loader label="Initialisation..." />;
  if (setup.data?.setup_available) return <Navigate to="/setup" replace />;
  return <Navigate to="/login" replace />;
}

function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-rose-600">403</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">Acces non autorise</h1>
        <p className="mt-2 text-sm text-slate-500">Votre role ne permet pas d'ouvrir cette page.</p>
      </div>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-sky-600">404</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">Page introuvable</h1>
        <p className="mt-2 text-sm text-slate-500">La route demandee n'existe pas.</p>
      </div>
    </main>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<StartupRedirect />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clients" element={<RequireRole roles={['manager', 'caissier']}><ClientsPage /></RequireRole>} />
          <Route path="/categories" element={<RequireRole roles={['manager', 'magasinier']}><CategoriesPage /></RequireRole>} />
          <Route path="/produits" element={<RequireRole roles={['manager', 'caissier', 'magasinier']}><ProduitsPage /></RequireRole>} />
          <Route path="/stock" element={<RequireRole roles={['manager', 'magasinier']}><StockPage /></RequireRole>} />
          <Route path="/fournisseurs" element={<RequireRole roles={['manager', 'magasinier']}><FournisseursPage /></RequireRole>} />
          <Route path="/produits_stock" element={<RequireRole roles={['manager', 'magasinier']}><ProduitsStockPage /></RequireRole>} />
          <Route path="/paniers" element={<RequireRole roles={['manager', 'caissier']}><PaniersPage /></RequireRole>} />
          <Route path="/ventes" element={<RequireRole roles={['manager', 'caissier']}><VentesPage /></RequireRole>} />
          <Route path="/ventes/:id" element={<RequireRole roles={['manager', 'caissier']}><VenteDetailsPage /></RequireRole>} />
          <Route path="/paiements" element={<RequireRole roles={['manager', 'caissier']}><PaiementsPage /></RequireRole>} />
          <Route path="/rapports" element={<RequireRole roles={['manager', 'caissier', 'magasinier']}><RapportsPage /></RequireRole>} />
          <Route path="/utilisateurs" element={<RequireRole roles={['manager']}><UtilisateursPage /></RequireRole>} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/mail" element={<RequireRole roles={['manager']}><MailPage /></RequireRole>} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
