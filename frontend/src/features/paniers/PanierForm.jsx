import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { FormField } from '../../components/forms/FormField.jsx';

export function PanierForm({ clients = [], produits = [], onSubmit, isLoading }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      client_id: form.get('client_id'),
      lignes: [{
        produit_id: form.get('produit_id'),
        quantite: Number(form.get('quantite')),
        prix_unitaire_ht: Number(form.get('prix_unitaire_ht')) || undefined,
      }],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <FormField label="Client">
        <Select name="client_id" required>
          <option value="">Choisir</option>
          {clients.map((client) => <option key={client.id_client} value={client.id_client}>{client.nom} {client.postnom}</option>)}
        </Select>
      </FormField>
      <FormField label="Produit">
        <Select name="produit_id" required>
          <option value="">Choisir</option>
          {produits.map((produit) => <option key={produit.id_produit} value={produit.id_produit}>{produit.nom}</option>)}
        </Select>
      </FormField>
      <FormField label="Quantite">
        <Input name="quantite" type="number" min="1" defaultValue="1" required />
      </FormField>
      <FormField label="Prix unitaire HT">
        <Input name="prix_unitaire_ht" type="number" min="0" step="0.01" placeholder="Prix produit par defaut" />
      </FormField>
      <Button type="submit" isLoading={isLoading}>Creer panier</Button>
    </form>
  );
}
