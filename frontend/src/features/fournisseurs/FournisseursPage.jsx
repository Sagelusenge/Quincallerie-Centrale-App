import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { FournisseurForm } from './FournisseurForm.jsx';
import { useCreateFournisseur, useDeleteFournisseur, useFournisseurs, useUpdateFournisseur } from './fournisseurQueries.js';

export function FournisseursPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const { showToast } = useToast();
  const fournisseurs = useFournisseurs();
  const createFournisseur = useCreateFournisseur();
  const updateFournisseur = useUpdateFournisseur();
  const deleteFournisseur = useDeleteFournisseur();

  const filtered = useMemo(() => (fournisseurs.data || []).filter((fournisseur) => (
    `${fournisseur.nom || ''} ${fournisseur.telephone || ''} ${fournisseur.email || ''}`.toLowerCase().includes(search.toLowerCase())
  )), [fournisseurs.data, search]);

  const submit = (payload) => {
    const mutation = editing
      ? updateFournisseur.mutateAsync({ id: editing.id_fournisseur, payload })
      : createFournisseur.mutateAsync(payload);
    mutation
      .then(() => { showToast('Fournisseur enregistre'); setOpen(false); setEditing(null); })
      .catch((error) => showToast(error.message, 'error'));
  };

  const remove = (row) => {
    deleteFournisseur
      .mutateAsync(row.id_fournisseur)
      .then(() => showToast('Fournisseur supprime ou desactive'))
      .catch((error) => showToast(error.message, 'error'));
  };

  if (fournisseurs.isLoading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Fournisseurs</h1>
          <p className="text-sm text-slate-500">Gestion des fournisseurs utilises pour les entrees de stock.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={18} /> Nouveau fournisseur</Button>
      </div>

      <Input className="max-w-md" placeholder="Rechercher un fournisseur" value={search} onChange={(event) => setSearch(event.target.value)} />

      <Table
        data={filtered}
        columns={[
          { key: 'nom', header: 'Nom' },
          { key: 'telephone', header: 'Telephone' },
          { key: 'email', header: 'Email' },
          { key: 'total_approvisionnements', header: 'Approvisionnements' },
          { key: 'quantite_totale_fournie', header: 'Quantite fournie' },
          { key: 'actif', header: 'Statut', render: (row) => <Badge color={row.actif ? 'success' : 'neutral'}>{row.actif ? 'Actif' : 'Inactif'}</Badge> },
        ]}
        renderActions={(row) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setEditing(row); setOpen(true); }}>Modifier</Button>
            <Button variant="danger" className="h-10 w-10 px-0" onClick={() => remove(row)}><Trash2 size={16} /></Button>
          </div>
        )}
      />

      <Modal open={open} title={editing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'} onClose={() => { setOpen(false); setEditing(null); }}>
        <FournisseurForm initialValues={editing || {}} onSubmit={submit} isLoading={createFournisseur.isPending || updateFournisseur.isPending} />
      </Modal>
    </div>
  );
}
