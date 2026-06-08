import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { PaiementForm } from './PaiementForm.jsx';
import { useCreatePaiement, useRapportCaisse, useRepartitionPaiements } from './paiementQueries.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function PaiementsPage() {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();
  const rapport = useRapportCaisse();
  const repartition = useRepartitionPaiements();
  const createPaiement = useCreatePaiement();

  const submit = (payload) => createPaiement.mutateAsync(payload).then(() => { showToast('Paiement enregistre'); setOpen(false); }).catch((error) => showToast(error.message, 'error'));
  if (rapport.isLoading) return <Loader />;

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
          { key: 'montant', header: 'Montant', render: (row) => formatCurrency(row.montant) },
          { key: 'mode_paiement', header: 'Mode' },
          { key: 'date_paiement', header: 'Date' },
        ]}
        emptyText="Aucun paiement journalier"
      />
      <Table
        data={Array.isArray(repartition.data) ? repartition.data : []}
        columns={[
          { key: 'mode_paiement', header: 'Mode' },
          { key: 'total', header: 'Total', render: (row) => formatCurrency(row.total || row.montant_total) },
        ]}
        emptyText="Aucune repartition disponible"
      />
      <Modal open={open} title="Enregistrer un paiement" onClose={() => setOpen(false)}>
        <PaiementForm onSubmit={submit} isLoading={createPaiement.isPending} />
      </Modal>
    </div>
  );
}
