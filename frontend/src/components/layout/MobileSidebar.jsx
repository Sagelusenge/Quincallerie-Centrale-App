import { X } from 'lucide-react';
import { Sidebar } from './Sidebar.jsx';
import { Button } from '../ui/Button.jsx';
import { useSidebar } from '../../contexts/SidebarContext.jsx';

export function MobileSidebar() {
  const { isMobileOpen, closeMobile } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="absolute inset-0 bg-slate-950/50" onClick={closeMobile} />
      <div className="absolute inset-y-0 left-0 w-72">
        <Sidebar onNavigate={closeMobile} />
      </div>
      <Button variant="secondary" className="absolute right-4 top-4 h-10 w-10 px-0" onClick={closeMobile} aria-label="Fermer">
        <X size={18} />
      </Button>
    </div>
  );
}
