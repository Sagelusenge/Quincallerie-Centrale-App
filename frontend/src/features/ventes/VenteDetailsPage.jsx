import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { useVente } from './venteQueries.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function VenteDetailsPage() {
  const { id } = useParams();
  const vente = useVente(id);
  if (vente.isLoading) return <Loader />;

  const data = vente.data || {};
  const lignes = data.lignes || data.articles || [];
  const factureId = data.id_vente || data.id_facture || id;
  const dateVente = formatDate(data.date_vente || data.date_facture || new Date().toISOString());

  const totalTTC = useMemo(
    () => formatCurrency(data.montant_total_ttc || data.total_ttc || lignes.reduce((sum, row) => {
      const prix = Number(row.prix || row.prix_unitaire_ht || 0);
      const quantite = Number(row.quantite || 0);
      return sum + prix * quantite;
    }, 0)),
    [data, lignes]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Facture {factureId}</h1>
          <p className="text-sm text-slate-500">{dateVente}</p>
        </div>
        <Button type="button" className="print:hidden" onClick={() => window.print()}>
          Imprimer
        </Button>
      </div>

      <Card className="space-y-6 p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{data.entreprise_nom || 'Entreprise'}</h2>
          {data.ville && <p className="text-sm text-slate-500">{data.ville}</p>}
        </div>

        <div className="grid gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="font-semibold">Client</p>
            <p>{data.client_nom || data.nom_client || data.client_id || '-'}</p>
            {data.client_tel && <p>{data.client_tel}</p>}
          </div>
          <div>
            <p className="font-semibold">Facture</p>
            <p>{factureId}</p>
          </div>
          <div>
            <p className="font-semibold">Total</p>
            <p>{totalTTC}</p>
          </div>
        </div>
      </Card>

      <Table
        data={lignes}
        columns={[
          { key: 'produit_nom', header: 'Produit', render: (row) => row.produit_nom || row.nom },
          { key: 'quantite', header: 'Quantite' },
          { key: 'prix', header: 'Prix', render: (row) => formatCurrency(row.prix || row.prix_unitaire_ht) },
          { key: 'total', header: 'Total', render: (row) => formatCurrency(row.total || row.total_ttc || row.sous_total) },
        ]}
      />
    </div>
  );
}
