import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { useVentes } from './venteQueries.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function VentesPage() {
  const ventes = useVentes();
  if (ventes.isLoading) return <Loader />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Ventes et factures</h1>
        <p className="text-sm text-slate-500">Suivi des factures et statuts de paiement.</p>
      </div>
      <Table
        data={ventes.data || []}
        columns={[
          { key: 'id_vente', header: 'Facture', render: (row) => row.id_vente || row.id_facture },
          { key: 'client_nom', header: 'Client', render: (row) => row.client_nom || row.nom_client || row.client_id },
          { key: 'date_vente', header: 'Date', render: (row) => formatDate(row.date_vente || row.date_facture) },
          { key: 'montant_total_ttc', header: 'Total', render: (row) => formatCurrency(row.montant_total_ttc || row.total_ttc) },
          { key: 'statut_paiement', header: 'Paiement', render: (row) => <Badge color={row.statut_paiement === 'paye' ? 'success' : 'warning'}>{row.statut_paiement || 'impaye'}</Badge> },
        ]}
        renderActions={(row) => (
          <Link
            to={`/ventes/${row.id_vente || row.id_facture}`}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
          >
            Voir
          </Link>
        )}
      />
    </div>
  );
}
