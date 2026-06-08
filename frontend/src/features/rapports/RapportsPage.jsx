import { Card } from '../../components/ui/Card.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { useRapportCreances, useRapportFactures, useRapportStock, useTopAcheteurs } from './rapportQueries.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function RapportsPage() {
  const factures = useRapportFactures();
  const creances = useRapportCreances();
  const stock = useRapportStock();
  const topAcheteurs = useTopAcheteurs();

  if (factures.isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Rapports</h1>
        <p className="text-sm text-slate-500">Analyses commerciales, stock et creances.</p>
      </div>
      <Card className="p-5">
        <h2 className="mb-4 text-lg font-semibold">Factures</h2>
        <Table data={factures.data || []} columns={[
          { key: 'id_vente', header: 'Facture' },
          { key: 'client_nom', header: 'Client' },
          { key: 'montant_total_ttc', header: 'Total', render: (row) => formatCurrency(row.montant_total_ttc || row.total_ttc) },
        ]} />
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Creances</h2>
          <Table data={creances.data || []} columns={[
            { key: 'client_nom', header: 'Client' },
            { key: 'reste_a_payer', header: 'Reste', render: (row) => formatCurrency(row.reste_a_payer) },
          ]} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Top acheteurs</h2>
          <Table data={topAcheteurs.data || []} columns={[
            { key: 'client_nom', header: 'Client' },
            { key: 'montant_total', header: 'Montant', render: (row) => formatCurrency(row.montant_total) },
          ]} />
        </Card>
      </div>
      <Card className="p-5">
        <h2 className="mb-4 text-lg font-semibold">Inventaire stock</h2>
        <Table data={stock.data || []} columns={[
          { key: 'reference_produit', header: 'Reference' },
          { key: 'nom', header: 'Produit' },
          { key: 'quantite_stock', header: 'Stock' },
        ]} />
      </Card>
    </div>
  );
}
