import { useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { useVente } from './venteQueries.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function VenteDetailsPage() {
  const { id } = useParams();
  const vente = useVente(id);
  if (vente.isLoading) return <Loader />;
  const data = vente.data || {};
  const lignes = data.lignes || data.articles || [];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Facture {id}</h1>
      <Card className="p-5">
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <p><span className="font-semibold">Client:</span> {data.client_nom || data.nom_client || data.client_id || '-'}</p>
          <p><span className="font-semibold">Total:</span> {formatCurrency(data.montant_total_ttc || data.total_ttc)}</p>
          <p><span className="font-semibold">Statut:</span> {data.statut_paiement || '-'}</p>
        </div>
      </Card>
      <Table
        data={lignes}
        columns={[
          { key: 'produit_nom', header: 'Produit', render: (row) => row.produit_nom || row.nom },
          { key: 'quantite', header: 'Quantite' },
          { key: 'prix', header: 'Prix', render: (row) => formatCurrency(row.prix || row.prix_unitaire_ht) },
          { key: 'total', header: 'Total', render: (row) => formatCurrency(row.total || row.sous_total) },
        ]}
      />
    </div>
  );
}
