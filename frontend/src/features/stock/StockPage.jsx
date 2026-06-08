import { Badge } from '../../components/ui/Badge.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { useProduits } from '../produits/produitQueries.js';
import { STOCK_STATUS_COLORS } from '../../utils/constants.js';

export function StockPage() {
  const produits = useProduits();
  if (produits.isLoading) return <Loader />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Stock</h1>
        <p className="text-sm text-slate-500">Inventaire rapide et seuils d'alerte.</p>
      </div>
      <Table
        data={produits.data || []}
        columns={[
          { key: 'reference_produit', header: 'Reference' },
          { key: 'nom', header: 'Produit' },
          { key: 'quantite_stock', header: 'Stock actuel' },
          { key: 'seuil_alerte', header: 'Seuil' },
          { key: 'statut_stock', header: 'Statut', render: (row) => <Badge color={STOCK_STATUS_COLORS[row.statut_stock] || 'neutral'}>{row.statut_stock}</Badge> },
        ]}
      />
    </div>
  );
}
