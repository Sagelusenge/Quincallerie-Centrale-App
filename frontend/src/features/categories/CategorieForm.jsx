import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { FormField } from '../../components/forms/FormField.jsx';

export function CategorieForm({ initialValues = {}, onSubmit, isLoading }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(Object.fromEntries(new FormData(event.currentTarget).entries()));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Reference">
        <Input name="reference_categorie" defaultValue={initialValues.reference_categorie} />
      </FormField>
      <FormField label="Nom">
        <Input name="nom" defaultValue={initialValues.nom} required />
      </FormField>
      <FormField label="Photo URL">
        <Input name="photo_url" defaultValue={initialValues.photo_url} />
      </FormField>
      <FormField label="Description">
        <Textarea name="description" defaultValue={initialValues.description} />
      </FormField>
      <Button type="submit" isLoading={isLoading}>Enregistrer</Button>
    </form>
  );
}
