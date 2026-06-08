import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { FormField } from '../../components/forms/FormField.jsx';

export function ProduitForm({ initialValues = {}, categories = [], onSubmit, isLoading }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      {!initialValues.id_produit && (
        <FormField label="Reference">
          <Input name="reference_produit" defaultValue={initialValues.reference_produit} required />
        </FormField>
      )}
      <FormField label="Nom">
        <Input name="nom" defaultValue={initialValues.nom} required />
      </FormField>
      <FormField label="Categorie">
        <Select name="categorie_id" defaultValue={initialValues.categorie_id || ''}>
          <option value="">Sans categorie</option>
          {categories.map((category) => <option key={category.id_categorie} value={category.id_categorie}>{category.nom}</option>)}
        </Select>
      </FormField>
      <FormField label="Photo URL">
        <Input name="photo_url" defaultValue={initialValues.photo_url} />
      </FormField>
      <FormField label="Prix HT">
        <Input name="prix_ht" type="number" min="0" step="0.01" defaultValue={initialValues.prix_ht} required />
      </FormField>
      <FormField label="TVA">
        <Input name="taux_tva" type="number" min="0" step="0.01" defaultValue={initialValues.taux_tva || 16} />
      </FormField>
      {!initialValues.id_produit && (
        <FormField label="Stock initial">
          <Input name="quantite_stock" type="number" min="0" defaultValue={initialValues.quantite_stock || 0} />
        </FormField>
      )}
      <FormField label="Seuil alerte">
        <Input name="seuil_alerte" type="number" min="0" defaultValue={initialValues.seuil_alerte || 5} />
      </FormField>
      <div className="flex items-end">
        <Button type="submit" isLoading={isLoading}>Enregistrer</Button>
      </div>
    </form>
  );
}
