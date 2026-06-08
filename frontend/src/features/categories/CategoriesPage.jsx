import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { CategorieForm } from './CategorieForm.jsx';
import { useCategories, useCreateCategorie, useDeleteCategorie, useUpdateCategorie } from './categorieQueries.js';
import { useToast } from '../../contexts/ToastContext.jsx';

export function CategoriesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { showToast } = useToast();
  const categories = useCategories();
  const createCategorie = useCreateCategorie();
  const updateCategorie = useUpdateCategorie();
  const deleteCategorie = useDeleteCategorie();

  const submit = (payload) => {
    const mutation = editing ? updateCategorie.mutateAsync({ id: editing.id_categorie, payload }) : createCategorie.mutateAsync(payload);
    mutation.then(() => { showToast('Categorie enregistree'); setOpen(false); setEditing(null); }).catch((error) => showToast(error.message, 'error'));
  };

  if (categories.isLoading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Categories</h1>
          <p className="text-sm text-slate-500">Classement des produits.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={18} /> Nouvelle categorie</Button>
      </div>
      <Table
        data={categories.data || []}
        columns={[
          { key: 'reference_categorie', header: 'Reference' },
          { key: 'nom', header: 'Nom' },
          { key: 'description', header: 'Description' },
        ]}
        renderActions={(row) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setEditing(row); setOpen(true); }}>Modifier</Button>
            <Button variant="danger" className="h-10 w-10 px-0" onClick={() => deleteCategorie.mutate(row.id_categorie)}><Trash2 size={16} /></Button>
          </div>
        )}
      />
      <Modal open={open} title={editing ? 'Modifier la categorie' : 'Nouvelle categorie'} onClose={() => { setOpen(false); setEditing(null); }}>
        <CategorieForm initialValues={editing || {}} onSubmit={submit} isLoading={createCategorie.isPending || updateCategorie.isPending} />
      </Modal>
    </div>
  );
}
