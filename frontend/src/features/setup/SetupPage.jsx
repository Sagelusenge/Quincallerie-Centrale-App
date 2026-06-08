import { useMutation, useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { setupApi } from '../../api/setupApi.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { FormField } from '../../components/forms/FormField.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export function SetupPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const status = useQuery({ queryKey: ['setup', 'status'], queryFn: setupApi.status });

  const mutation = useMutation({
    mutationFn: setupApi.createCompany,
    onSuccess: () => {
      showToast('Configuration initiale terminee');
      navigate('/login', { replace: true });
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate(Object.fromEntries(form.entries()));
  };

  if (status.data && status.data.setup_available === false) return <Navigate to="/login" replace />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <Card className="w-full max-w-3xl p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-sky-600 p-3 text-white"><Building2 size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Configuration initiale</h1>
            <p className="text-sm text-slate-500">Creez l'entreprise et le premier manager.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <FormField label="ID entreprise">
            <Input name="id_entreprise" placeholder="Optionnel" />
          </FormField>
          <FormField label="Raison sociale">
            <Input name="raison_sociale" required placeholder="Entreprise Cliente SARL" />
          </FormField>
          <FormField label="Numero national">
            <Input name="num_id_nationale" placeholder="CD-KIN-2026-001" />
          </FormField>
          <FormField label="Email entreprise">
            <Input name="email_entreprise" type="email" placeholder="contact@client.local" />
          </FormField>
          <FormField label="Ville">
            <Input name="ville" placeholder="Kinshasa" />
          </FormField>
          <FormField label="Code setup">
            <Input name="setup_code" placeholder="Si requis" />
          </FormField>
          <FormField label="Nom manager">
            <Input name="nom_manager" required />
          </FormField>
          <FormField label="Email manager">
            <Input name="email_manager" type="email" required />
          </FormField>
          <FormField label="Mot de passe manager">
            <Input name="mot_de_passe_manager" type="password" required minLength={6} />
          </FormField>
          <div className="flex items-end">
            <Button type="submit" className="w-full" isLoading={mutation.isPending}>Configurer</Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
