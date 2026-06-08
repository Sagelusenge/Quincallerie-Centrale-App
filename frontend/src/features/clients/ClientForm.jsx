import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { FormField } from '../../components/forms/FormField.jsx';

export function ClientForm({ initialValues = {}, onSubmit, isLoading }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(Object.fromEntries(new FormData(event.currentTarget).entries()));
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <FormField label="Nom">
        <Input name="nom" defaultValue={initialValues.nom} required />
      </FormField>
      <FormField label="Postnom">
        <Input name="postnom" defaultValue={initialValues.postnom} />
      </FormField>
      <FormField label="Telephone">
        <Input name="telephone" defaultValue={initialValues.telephone} />
      </FormField>
      <div className="flex items-end">
        <Button type="submit" isLoading={isLoading}>Enregistrer</Button>
      </div>
    </form>
  );
}
