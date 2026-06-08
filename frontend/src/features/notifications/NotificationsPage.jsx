import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { useNotifications, useReadNotification } from './notificationQueries.js';
import { formatDate } from '../../utils/formatDate.js';

export function NotificationsPage() {
  const notifications = useNotifications();
  const read = useReadNotification();
  if (notifications.isLoading) return <Loader />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Notifications</h1>
        <p className="text-sm text-slate-500">Alertes internes et demandes utilisateurs.</p>
      </div>
      <Table
        data={notifications.data || []}
        columns={[
          { key: 'titre', header: 'Titre' },
          { key: 'message', header: 'Message' },
          { key: 'lu', header: 'Statut', render: (row) => <Badge color={row.lu ? 'success' : 'warning'}>{row.lu ? 'Lue' : 'Non lue'}</Badge> },
          { key: 'created_at', header: 'Date', render: (row) => formatDate(row.created_at || row.date_creation) },
        ]}
        renderActions={(row) => !row.lu ? <Button variant="secondary" onClick={() => read.mutate(row.id_notification)}>Marquer lue</Button> : null}
      />
    </div>
  );
}
