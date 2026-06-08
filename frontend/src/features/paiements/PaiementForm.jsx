import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { FormField } from '../../components/forms/FormField.jsx';
import { PAYMENT_MODES } from '../../utils/constants.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

const getFactureId = (facture) =>
  facture?.id_vente || facture?.id_facture || facture?.numero_facture || facture?.id_ventes;

export function PaiementForm({ factures = [], onSubmit, isLoading }) {
  const [venteId, setVenteId] = useState('');
  const selectedFacture = useMemo(() => (
    factures.find((facture) => String(getFactureId(facture)) === String(venteId))
  ), [factures, venteId]);
  const reste = Number(selectedFacture?.reste_a_payer ?? selectedFacture?.montant_ttc ?? 0);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(Object.fromEntries(new FormData(event.currentTarget).entries()));
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <FormField label="Facture">
        <Select name="vente_id" required value={venteId} onChange={(event) => setVenteId(event.target.value)}>
          <option value="">Choisir une facture</option>
          {factures.map((facture) => {
            const id = getFactureId(facture);
            return (
              <option key={id} value={id}>
                {id} - {facture.client_nom || facture.client_id} - reste {formatCurrency(facture.reste_a_payer ?? facture.montant_ttc)}
              </option>
            );
          })}
        </Select>
      </FormField>
      <FormField label="Montant">
        <Input name="montant" type="number" min="0" max={reste || undefined} step="0.01" required placeholder={reste ? formatCurrency(reste) : ''} />
      </FormField>
      {selectedFacture ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950 md:col-span-2">
          <p className="text-slate-500">Facture selectionnee</p>
          <p className="font-semibold text-slate-950 dark:text-white">
            Total: {formatCurrency(selectedFacture.montant_ttc)} - Reste: {formatCurrency(reste)}
          </p>
        </div>
      ) : null}
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
