import { Bell, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, selectCurrentUser } from '../../features/auth/authSlice.js';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useSidebar } from '../../contexts/SidebarContext.jsx';
import { ROLES } from '../../utils/roles.js';

export function Topbar() {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { openMobile } = useSidebar();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="h-10 w-10 px-0 lg:hidden" onClick={openMobile} aria-label="Menu">
          <Menu size={20} />
        </Button>
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Espace de gestion</p>
          <p className="text-xs text-slate-500">Quincaillerie Centrale</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" className="h-10 w-10 px-0" onClick={toggleTheme} aria-label="Theme">
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </Button>
        <Button variant="ghost" className="h-10 w-10 px-0" onClick={() => navigate('/notifications')} aria-label="Notifications">
          <Bell size={24} />
        </Button>
        <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 dark:border-slate-800 sm:flex">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.nom || 'Utilisateur'}</p>
            <Badge color="info">{ROLES[user?.role] || user?.role || 'Role'}</Badge>
          </div>
        </div>
        <Button variant="ghost" className="h-10 w-10 px-0" onClick={handleLogout} aria-label="Deconnexion">
          <LogOut size={24} />
        </Button>
      </div>
    </header>
  );
}
