import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { MobileSidebar } from './MobileSidebar.jsx';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="fixed inset-y-0 left-0 hidden lg:block">
        <Sidebar />
      </div>
      <MobileSidebar />
      <div className="lg:pl-72">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
