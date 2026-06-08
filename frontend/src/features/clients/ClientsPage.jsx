import { useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { ClientForm } from './ClientForm.jsx';
import { useClients, useCreateClient, useDeleteClient, useUpdateClient } from './clientQueries.js';
import { useToast } from '../../contexts/ToastContext.jsx';

export function ClientsPage() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();
  const clients = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const filtered = useMemo(() => (clients.data || []).filter((client) => `${client.nom || ''} ${client.postnom || ''} ${client.telephone || ''}`.toLowerCase().includes(search.toLowerCase())), [clients.data, search]);

  const submit = (payload) => {
    const mutation = editing ? updateClient.mutateAsync({ id: editing.id_client, payload }) : createClient.mutateAsync(payload);
    mutation.then(() => {
      showToast(editing ? 'Client modifie' : 'Client cree');
      setOpen(false);
      setEditing(null);
    }).catch((error) => showToast(error.message, 'error'));
  };

  if (clients.isLoading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Clients</h1>
          <p className="text-sm text-slate-500">Gestion du portefeuille client.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={18} /> Nouveau client</Button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <Input className="pl-10" placeholder="Rechercher un client" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      <Table
        data={filtered}
        columns={[
          { key: 'nom', header: 'Nom', render: (row) => `${row.nom || ''} ${row.postnom || ''}`.trim() },
          { key: 'telephone', header: 'Telephone' },
          { key: 'chiffre_affaires', header: 'CA' },
        ]}
        renderActions={(row) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setEditing(row); setOpen(true); }}>Modifier</Button>
            <Button variant="danger" className="h-10 w-10 px-0" onClick={() => deleteClient.mutate(row.id_client)}><Trash2 size={16} /></Button>
          </div>
        )}
      />
      <Modal open={open} title={editing ? 'Modifier le client' : 'Nouveau client'} onClose={() => { setOpen(false); setEditing(null); }}>
        <ClientForm initialValues={editing || {}} onSubmit={submit} isLoading={createClient.isPending || updateClient.isPending} />
      </Modal>
    </div>
  );
}
