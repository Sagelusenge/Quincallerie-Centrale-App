import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { FormField } from '../../components/forms/FormField.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function VenteForm({ clients = [], produits = [], onSubmit, isLoading }) {
  const [clientId, setClientId] = useState('');
  const [produitId, setProduitId] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [prix, setPrix] = useState('');

  const selectedProduit = useMemo(
    () => produits.find((produit) => String(produit.id_produit) === String(produitId)),
    [produits, produitId]
  );

  const prixUnitaire = prix !== '' ? Number(prix) : selectedProduit?.prix_ht ?? 0;
  const total = quantite * prixUnitaire;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      client_id: clientId,
      articles: [{
        produit_id: produitId,
        quantite: Number(quantite),
        prix: prix !== '' ? Number(prix) : undefined,
      }],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <FormField label="Client">
        <Select name="client_id" required value={clientId} onChange={(event) => setClientId(event.target.value)}>
          <option value="">Choisir</option>
          {clients.map((client) => (
            <option key={client.id_client} value={client.id_client}>
              {client.nom} {client.postnom}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Produit">
        <Select
          name="produit_id"
          required
          value={produitId}
          onChange={(event) => {
            setProduitId(event.target.value);
            const produit = produits.find((item) => String(item.id_produit) === String(event.target.value));
            if (produit && produit.prix_ht !== undefined) {
              setPrix(String(produit.prix_ht));
            }
          }}
        >
          <option value="">Choisir</option>
          {produits.map((produit) => (
            <option key={produit.id_produit} value={produit.id_produit}>
              {produit.nom}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Quantité">
        <Input
          name="quantite"
          type="number"
          min="1"
          value={quantite}
          onChange={(event) => setQuantite(Number(event.target.value) || 1)}
          required
        />
      </FormField>

      <FormField label="Prix unitaire HT">
        <Input
          name="prix"
          type="number"
          min="0"
          step="0.01"
          value={prix}
          onChange={(event) => setPrix(event.target.value)}
          placeholder="Optionnel - prix produit par defaut"
        />
      </FormField>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950 md:col-span-2">
        <p className="text-sm text-slate-500">Total calculé</p>
        <p className="text-2xl font-semibold text-slate-950 dark:text-white">{formatCurrency(total)}</p>
      </div>

      <div className="md:col-span-2">
        <Button type="submit" isLoading={isLoading}>
          Enregistrer la vente
        </Button>
      </div>
    </form>
  );
}
