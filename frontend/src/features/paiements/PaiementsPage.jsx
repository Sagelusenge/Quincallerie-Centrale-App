import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { PaiementForm } from './PaiementForm.jsx';
import { useCreatePaiement, useRapportCaisse } from './paiementQueries.js';
import { useVentes } from '../ventes/venteQueries.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function PaiementsPage() {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();
  const rapport = useRapportCaisse();
  const ventes = useVentes();
  const createPaiement = useCreatePaiement();

  const submit = (payload) => createPaiement.mutateAsync(payload).then(() => { showToast('Paiement enregistre'); setOpen(false); }).catch((error) => showToast(error.message, 'error'));
  if (rapport.isLoading || ventes.isLoading) return <Loader />;

  const facturesAPayer = (ventes.data || []).filter((vente) => Number(vente.reste_a_payer ?? vente.montant_ttc ?? 0) > 0);

  return (
    <div className="space-y-5">
      <div className="flex justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Paiements</h1>
          <p className="text-sm text-slate-500">Encaissements et repartition des modes de paiement.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={18} /> Nouveau paiement</Button>
      </div>
      <Table
        data={Array.isArray(rapport.data) ? rapport.data : []}
        columns={[
          { key: 'vente_id', header: 'Facture' },
          { key: 'client_nom', header: 'Client', render: (row) => row.client_nom_complet || [row.client_nom, row.client_postnom].filter(Boolean).join(' ') || '-' },
          { key: 'montant', header: 'Montant', render: (row) => formatCurrency(row.montant) },
          { key: 'mode_paiement', header: 'Mode' },
          { key: 'date_paiement', header: 'Date', render: (row) => formatDate(row.date_paiement) },
        ]}
        emptyText="Aucun paiement journalier"
      />
      <Modal open={open} title="Enregistrer un paiement" onClose={() => setOpen(false)}>
        <PaiementForm factures={facturesAPayer} onSubmit={submit} isLoading={createPaiement.isPending} />
      </Modal>
    </div>
  );
}
