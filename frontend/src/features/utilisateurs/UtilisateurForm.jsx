import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { FormField } from '../../components/forms/FormField.jsx';

export function UtilisateurForm({ initialValues = {}, onSubmit, isLoading }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (!payload.mot_de_passe) delete payload.mot_de_passe;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <FormField label="Nom">
        <Input name="nom" defaultValue={initialValues.nom} required />
      </FormField>
      <FormField label="Email">
        <Input name="email" type="email" defaultValue={initialValues.email} required />
      </FormField>
      <FormField label="Role">
        <Select name="role" defaultValue={initialValues.role || 'caissier'}>
          <option value="manager">Manager</option>
          <option value="caissier">Caissier</option>
          <option value="magasinier">Magasinier</option>
        </Select>
      </FormField>
      <FormField label="Mot de passe">
        <Input name="mot_de_passe" type="password" placeholder={initialValues.id_utilisateur ? 'Optionnel' : 'Requis'} required={!initialValues.id_utilisateur} />
      </FormField>
      <Button type="submit" isLoading={isLoading}>Enregistrer</Button>
    </form>
  );
}
