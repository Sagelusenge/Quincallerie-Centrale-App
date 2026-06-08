import { Table } from '../../components/ui/Table.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { useMouvementsStock } from '../produits/produitQueries.js';
import { formatDate } from '../../utils/formatDate.js';

export function StockMovementPage() {
  const mouvements = useMouvementsStock();
  if (mouvements.isLoading) return <Loader />;

  return (
    <Table
      data={mouvements.data || []}
      columns={[
        { key: 'produit_nom', header: 'Produit' },
        { key: 'type_mouvement', header: 'Type' },
        { key: 'quantite', header: 'Quantite' },
        { key: 'date_mouvement', header: 'Date', render: (row) => formatDate(row.date_mouvement) },
      ]}
    />
  );
}
