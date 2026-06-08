import { useMutation, useQuery } from '@tanstack/react-query';
import { mailApi } from '../../api/mailApi.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { FormField } from '../../components/forms/FormField.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export function MailPage() {
  const { showToast } = useToast();
  const status = useQuery({ queryKey: ['mail', 'status'], queryFn: mailApi.status });
  const messages = useQuery({ queryKey: ['mail', 'messages'], queryFn: mailApi.messages });
  const send = useMutation({ mutationFn: mailApi.send, onSuccess: () => showToast('Email envoye'), onError: (error) => showToast(error.message, 'error') });

  const handleSubmit = (event) => {
    event.preventDefault();
    send.mutate(Object.fromEntries(new FormData(event.currentTarget).entries()));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Mail</h1>
        <p className="text-sm text-slate-500">Configuration et envoi d'emails.</p>
      </div>
      <Card className="p-5">
        <p className="text-sm text-slate-600 dark:text-slate-300">Statut mail: {status.data?.configured ? 'Configure' : 'Non configure'}</p>
      </Card>
      <Card className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Destinataire"><Input name="to" type="email" required /></FormField>
          <FormField label="Sujet"><Input name="subject" required /></FormField>
          <FormField label="Message"><Textarea name="message" required /></FormField>
          <Button type="submit" isLoading={send.isPending}>Envoyer</Button>
        </form>
      </Card>
      <Table data={messages.data || []} columns={[
        { key: 'to', header: 'Destinataire' },
        { key: 'subject', header: 'Sujet' },
        { key: 'created_at', header: 'Date' },
      ]} emptyText="Aucun message envoye" />
    </div>
  );
}
