import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { UtilisateurForm } from './UtilisateurForm.jsx';
import { useCreateUtilisateur, useToggleUtilisateur, useUpdateUtilisateur, useUtilisateurs } from './utilisateurQueries.js';
import { useToast } from '../../contexts/ToastContext.jsx';

export function UtilisateursPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { showToast } = useToast();
  const utilisateurs = useUtilisateurs();
  const createUtilisateur = useCreateUtilisateur();
  const updateUtilisateur = useUpdateUtilisateur();
  const toggleUtilisateur = useToggleUtilisateur();

  const submit = (payload) => {
    const mutation = editing ? updateUtilisateur.mutateAsync({ id: editing.id_utilisateur, payload }) : createUtilisateur.mutateAsync(payload);
    mutation.then(() => { showToast('Utilisateur enregistre'); setOpen(false); setEditing(null); }).catch((error) => showToast(error.message, 'error'));
  };

  if (utilisateurs.isLoading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Utilisateurs</h1>
          <p className="text-sm text-slate-500">Comptes internes et roles.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={18} /> Nouvel utilisateur</Button>
      </div>
      <Table
        data={utilisateurs.data || []}
        columns={[
          { key: 'nom', header: 'Nom' },
          { key: 'email', header: 'Email' },
          { key: 'role', header: 'Role', render: (row) => <Badge color="info">{row.role}</Badge> },
          { key: 'actif', header: 'Statut', render: (row) => <Badge color={row.actif ? 'success' : 'danger'}>{row.actif ? 'Actif' : 'Inactif'}</Badge> },
        ]}
        renderActions={(row) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setEditing(row); setOpen(true); }}>Modifier</Button>
            <Button variant="secondary" onClick={() => toggleUtilisateur.mutate(row.id_utilisateur)}>{row.actif ? 'Desactiver' : 'Activer'}</Button>
          </div>
        )}
      />
      <Modal open={open} title={editing ? 'Modifier utilisateur' : 'Nouvel utilisateur'} onClose={() => { setOpen(false); setEditing(null); }}>
        <UtilisateurForm initialValues={editing || {}} onSubmit={submit} isLoading={createUtilisateur.isPending || updateUtilisateur.isPending} />
      </Modal>
    </div>
  );
}
