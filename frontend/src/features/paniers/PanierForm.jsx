import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { FormField } from '../../components/forms/FormField.jsx';

export function PanierForm({ clients = [], produits = [], onSubmit, isLoading }) {
  const [lignes, setLignes] = useState([{ id: crypto.randomUUID(), produit_id: '', quantite: 1, prix_unitaire_ht: '' }]);

  const updateLigne = (id, field, value) => {
    setLignes((items) => items.map((ligne) => (ligne.id === id ? { ...ligne, [field]: value } : ligne)));
  };

  const addLigne = () => {
    setLignes((items) => [...items, { id: crypto.randomUUID(), produit_id: '', quantite: 1, prix_unitaire_ht: '' }]);
  };

  const removeLigne = (id) => {
    setLignes((items) => (items.length > 1 ? items.filter((ligne) => ligne.id !== id) : items));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      client_id: form.get('client_id'),
      lignes: lignes.map((ligne) => ({
        produit_id: ligne.produit_id,
        quantite: Number(ligne.quantite),
        prix_unitaire_ht: Number(ligne.prix_unitaire_ht) || undefined,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Client">
        <Select name="client_id" required>
          <option value="">Choisir</option>
          {clients.map((client) => <option key={client.id_client} value={client.id_client}>{client.nom} {client.postnom}</option>)}
        </Select>
      </FormField>

      <div className="space-y-3">
        {lignes.map((ligne, index) => (
          <div key={ligne.id} className="grid gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800 md:grid-cols-[minmax(0,1fr)_110px_150px_40px]">
            <FormField label={`Produit ${index + 1}`}>
              <Select value={ligne.produit_id} onChange={(event) => updateLigne(ligne.id, 'produit_id', event.target.value)} required>
                <option value="">Choisir</option>
                {produits.map((produit) => <option key={produit.id_produit} value={produit.id_produit}>{produit.nom}</option>)}
              </Select>
            </FormField>
            <FormField label="Quantite">
              <Input type="number" min="1" value={ligne.quantite} onChange={(event) => updateLigne(ligne.id, 'quantite', event.target.value)} required />
            </FormField>
            <FormField label="Prix HT">
              <Input type="number" min="0" step="0.01" value={ligne.prix_unitaire_ht} onChange={(event) => updateLigne(ligne.id, 'prix_unitaire_ht', event.target.value)} placeholder="Defaut" />
            </FormField>
            <div className="flex items-end">
              <Button type="button" variant="danger" className="h-10 w-10 px-0" onClick={() => removeLigne(ligne.id)} disabled={lignes.length === 1}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={addLigne}>
        <Plus size={16} /> Ajouter un produit
      </Button>

      <Button type="submit" isLoading={isLoading}>Creer panier</Button>
    </form>
  );
}
