import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { useClients } from '../clients/clientQueries.js';
import { useProduits } from '../produits/produitQueries.js';
import { PanierForm } from './PanierForm.jsx';
import { useConvertirPanier, useCreatePanier, usePaniers } from './panierQueries.js';
import { useToast } from '../../contexts/ToastContext.jsx';

export function PaniersPage() {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();
  const paniers = usePaniers();
  const clients = useClients();
  const produits = useProduits();
  const createPanier = useCreatePanier();
  const convertir = useConvertirPanier();

  const submit = (payload) => createPanier.mutateAsync(payload).then(() => { showToast('Panier cree'); setOpen(false); }).catch((error) => showToast(error.message, 'error'));
  if (paniers.isLoading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Paniers</h1>
          <p className="text-sm text-slate-500">Preparation des achats avant facture.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={18} /> Nouveau panier</Button>
      </div>
      <Table
        data={paniers.data || []}
        columns={[
          { key: 'id_panier', header: 'Panier' },
          { key: 'client_nom', header: 'Client', render: (row) => row.client_nom || row.nom_client || row.client_id },
          { key: 'statut', header: 'Statut', render: (row) => <Badge color={row.statut === 'en_attente' ? 'warning' : 'success'}>{row.statut || 'en_attente'}</Badge> },
          { key: 'total_ttc', header: 'Total' },
        ]}
        renderActions={(row) => <Button variant="secondary" onClick={() => convertir.mutate(row.id_panier)}>Convertir</Button>}
      />
      <Modal open={open} title="Nouveau panier" onClose={() => setOpen(false)}>
        <PanierForm clients={clients.data || []} produits={produits.data || []} onSubmit={submit} isLoading={createPanier.isPending} />
      </Modal>
    </div>
  );
}
