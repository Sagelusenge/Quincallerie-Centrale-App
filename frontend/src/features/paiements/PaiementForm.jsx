import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { FormField } from '../../components/forms/FormField.jsx';
import { PAYMENT_MODES } from '../../utils/constants.js';

export function PaiementForm({ onSubmit, isLoading }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(Object.fromEntries(new FormData(event.currentTarget).entries()));
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <FormField label="Facture">
        <Input name="vente_id" required placeholder="FAC-2026-00001" />
      </FormField>
      <FormField label="Montant">
        <Input name="montant" type="number" min="0" step="0.01" required />
      </FormField>
      <FormField label="Mode">
        <Select name="mode_paiement" defaultValue="especes">
          {PAYMENT_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
        </Select>
      </FormField>
      <FormField label="Reference externe">
        <Input name="reference_externe" />
      </FormField>
      <FormField label="Telephone payeur">
        <Input name="telephone_payeur" />
      </FormField>
      <div className="flex items-end">
        <Button type="submit" isLoading={isLoading}>Enregistrer</Button>
      </div>
    </form>
  );
}
