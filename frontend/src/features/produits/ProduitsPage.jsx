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
import { useFournisseurs } from '../fournisseurs/fournisseurQueries.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { STOCK_STATUS_COLORS } from '../../utils/constants.js';
import { canAccess } from '../../utils/roles.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useSelector } from 'react-redux';
import { selectUserRole } from '../auth/authSlice.js';

const selectClass = 'min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-sky-950';

export function ProduitsPage() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [restock, setRestock] = useState(null);
  const { showToast } = useToast();
  const role = useSelector(selectUserRole);
  const canManageStock = canAccess(role, ['manager', 'magasinier']);
  const produits = useProduits();
  const categories = useCategories();
  const fournisseurs = useFournisseurs({ enabled: canManageStock });
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

  if (produits.isLoading || (canManageStock && fournisseurs.isLoading)) return <Loader />;

  const activeFournisseurs = canManageStock ? (fournisseurs.data || []).filter((fournisseur) => fournisseur.actif) : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Produits</h1>
          <p className="text-sm text-slate-500">Catalogue, prix et disponibilite stock.</p>
        </div>
        {canManageStock ? <Button onClick={() => setOpen(true)}><Plus size={18} /> Nouveau produit</Button> : null}
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
        renderActions={canManageStock ? (row) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" className="h-10 w-10 px-0" onClick={() => setRestock(row)}><PackagePlus size={16} /></Button>
            <Button variant="secondary" onClick={() => { setEditing(row); setOpen(true); }}>Modifier</Button>
            <Button variant="danger" className="h-10 w-10 px-0" onClick={() => deleteProduit.mutate(row.id_produit)}><Trash2 size={16} /></Button>
          </div>
        ) : undefined}
      />
      <Modal open={open} title={editing ? 'Modifier le produit' : 'Nouveau produit'} onClose={() => { setOpen(false); setEditing(null); }}>
        <ProduitForm initialValues={editing || {}} categories={categories.data || []} onSubmit={submit} isLoading={createProduit.isPending || updateProduit.isPending} />
      </Modal>
      <Modal open={Boolean(restock)} title="Approvisionner le stock" onClose={() => setRestock(null)}>
        <form onSubmit={submitRestock} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">{restock?.nom}</p>
          <select name="fournisseur_id" required defaultValue="" className={selectClass}>
            <option value="" disabled>Choisir un fournisseur</option>
            {activeFournisseurs.map((fournisseur) => (
              <option key={fournisseur.id_fournisseur} value={fournisseur.id_fournisseur}>{fournisseur.nom}</option>
            ))}
          </select>
          <Input name="quantite" type="number" min="1" required placeholder="Quantite" />
          <Button type="submit" isLoading={approvisionner.isPending} disabled={activeFournisseurs.length === 0}>Valider</Button>
        </form>
      </Modal>
    </div>
  );
}
