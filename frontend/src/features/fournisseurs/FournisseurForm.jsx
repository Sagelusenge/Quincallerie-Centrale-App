import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { FormField } from '../../components/forms/FormField.jsx';

const selectClass = 'min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-sky-950';

export function FournisseurForm({ initialValues = {}, onSubmit, isLoading }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(Object.fromEntries(new FormData(event.currentTarget).entries()));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nom">
        <Input name="nom" defaultValue={initialValues.nom} required />
      </FormField>
      <FormField label="Telephone">
        <Input name="telephone" defaultValue={initialValues.telephone} />
      </FormField>
      <FormField label="Email">
        <Input name="email" type="email" defaultValue={initialValues.email} />
      </FormField>
      <FormField label="Adresse">
        <Textarea name="adresse" defaultValue={initialValues.adresse} />
      </FormField>
      {initialValues.id_fournisseur ? (
        <FormField label="Statut">
          <select name="actif" defaultValue={Number(initialValues.actif ?? 1)} className={selectClass}>
            <option value="1">Actif</option>
            <option value="0">Inactif</option>
          </select>
        </FormField>
      ) : null}
      <Button type="submit" isLoading={isLoading}>Enregistrer</Button>
    </form>
  );
}
