import { AlertTriangle, Package, ReceiptText, ShoppingCart, Users } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { useAlertesStock, useDashboardStats, useProduitsPlusVendus } from './dashboardQueries.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function DashboardPage() {
  const stats = useDashboardStats();
  const alertes = useAlertesStock();
  const topProduits = useProduitsPlusVendus();
  const data = stats.data || {};

  if (stats.isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500">Vue globale de l'activite commerciale.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Clients" value={data.total_clients ?? data.clients ?? 0} tone="sky" />
        <StatCard icon={ReceiptText} label="CA du mois" value={formatCurrency(data.chiffre_affaires_mois ?? data.ca_mois)} tone="emerald" />
        <StatCard icon={ShoppingCart} label="Paniers en attente" value={data.paniers_en_attente ?? 0} tone="amber" />
        <StatCard icon={AlertTriangle} label="Alertes stock" value={data.alertes_stock ?? 0} tone="rose" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">Produits en alerte</h2>
          <Table
            data={alertes.data || []}
            columns={[
              { key: 'nom', header: 'Produit' },
              { key: 'quantite_stock', header: 'Stock' },
              { key: 'seuil_alerte', header: 'Seuil' },
            ]}
            emptyText="Aucune alerte stock"
          />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">Produits les plus vendus</h2>
          <Table
            data={topProduits.data || []}
            columns={[
              { key: 'nom', header: 'Produit', render: (row) => row.nom || row.produit_nom },
              { key: 'quantite_vendue', header: 'Quantite' },
              { key: 'montant_total', header: 'Montant', render: (row) => formatCurrency(row.montant_total) },
            ]}
            emptyText="Aucune vente pour le moment"
          />
        </Card>
      </div>
    </div>
  );
}
