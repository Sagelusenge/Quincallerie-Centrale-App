import { useMemo, useState } from 'react';
import { PackagePlus, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { ProduitForm } from './ProduitForm.jsx';
import { useCategories } from '../categories/categorieQueries.js';
import { useApprovisionnerProduit, useCreateProduit, useDeleteProduit, useProduits, useUpdateProduit } from './produitQueries.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { STOCK_STATUS_COLORS } from '../../utils/constants.js';
import { useToast } from '../../contexts/ToastContext.jsx';

export function ProduitsPage() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [restock, setRestock] = useState(null);
  const { showToast } = useToast();
  const produits = useProduits();
  const categories = useCategories();
  const createProduit = useCreateProduit();
  const updateProduit = useUpdateProduit();
  const deleteProduit = useDeleteProduit();
  const approvisionner = useApprovisionnerProduit();

  const filtered = useMemo(() => (produits.data || []).filter((produit) => `${produit.nom || ''} ${produit.reference_produit || ''}`.toLowerCase().includes(search.toLowerCase())), [produits.data, search]);

  const submit = (payload) => {
    const mutation = editing ? updateProduit.mutateAsync({ id: editing.id_produit, payload }) : createProduit.mutateAsync(payload);
    mutation.then(() => { showToast('Produit enregistre'); setOpen(false); setEditing(null); }).catch((error) => showToast(error.message, 'error'));
  };

  const submitRestock = (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    approvisionner.mutateAsync({ id: restock.id_produit, payload }).then(() => { showToast('Stock mis a jour'); setRestock(null); }).catch((error) => showToast(error.message, 'error'));
  };

  if (produits.isLoading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Produits</h1>
          <p className="text-sm text-slate-500">Catalogue, prix et disponibilite stock.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={18} /> Nouveau produit</Button>
      </div>
      <Input className="max-w-md" placeholder="Rechercher par nom ou reference" value={search} onChange={(event) => setSearch(event.target.value)} />
      <Table
        data={filtered}
        columns={[
          { key: 'reference_produit', header: 'Reference' },
          { key: 'nom', header: 'Produit' },
          { key: 'categorie_nom', header: 'Categorie' },
          { key: 'prix_ht', header: 'Prix HT', render: (row) => formatCurrency(row.prix_ht) },
          { key: 'quantite_stock', header: 'Stock' },
          { key: 'statut_stock', header: 'Statut', render: (row) => <Badge color={STOCK_STATUS_COLORS[row.statut_stock] || 'neutral'}>{row.statut_stock || 'OK'}</Badge> },
        ]}
        renderActions={(row) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" className="h-10 w-10 px-0" onClick={() => setRestock(row)}><PackagePlus size={16} /></Button>
            <Button variant="secondary" onClick={() => { setEditing(row); setOpen(true); }}>Modifier</Button>
            <Button variant="danger" className="h-10 w-10 px-0" onClick={() => deleteProduit.mutate(row.id_produit)}><Trash2 size={16} /></Button>
          </div>
        )}
      />
      <Modal open={open} title={editing ? 'Modifier le produit' : 'Nouveau produit'} onClose={() => { setOpen(false); setEditing(null); }}>
        <ProduitForm initialValues={editing || {}} categories={categories.data || []} onSubmit={submit} isLoading={createProduit.isPending || updateProduit.isPending} />
      </Modal>
      <Modal open={Boolean(restock)} title="Approvisionner le stock" onClose={() => setRestock(null)}>
        <form onSubmit={submitRestock} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">{restock?.nom}</p>
          <Input name="quantite" type="number" min="1" required placeholder="Quantite" />
          <Button type="submit" isLoading={approvisionner.isPending}>Valider</Button>
        </form>
      </Modal>
    </div>
  );
}
