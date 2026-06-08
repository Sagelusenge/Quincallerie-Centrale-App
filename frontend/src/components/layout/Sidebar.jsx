import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, Boxes, ChartNoAxesCombined, ChevronDown, ClipboardList, CreditCard, FolderTree,
  Home, Mail, Package, PackagePlus, ReceiptText, ShoppingCart, Truck, Users, Warehouse,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUserRole } from '../../features/auth/authSlice.js';
import { canAccess } from '../../utils/roles.js';

const dashboardItem = { to: '/dashboard', label: 'Dashboard', icon: Home, roles: ['manager', 'caissier', 'magasinier'] };

const sections = [
  {
    label: 'Commercial',
    items: [
      { to: '/clients', label: 'Clients', icon: Users, roles: ['manager', 'caissier'] },
      { to: '/paniers', label: 'Paniers', icon: ShoppingCart, roles: ['manager', 'caissier'] },
      { to: '/ventes', label: 'Ventes', icon: ReceiptText, roles: ['manager', 'caissier'] },
      { to: '/paiements', label: 'Paiements', icon: CreditCard, roles: ['manager', 'caissier'] },
    ],
  },
  {
    label: 'Stock',
    items: [
      { to: '/categories', label: 'Categories', icon: FolderTree, roles: ['manager', 'magasinier'] },
      { to: '/produits', label: 'Produits', icon: Package, roles: ['manager', 'caissier', 'magasinier'] },
      { to: '/stock', label: 'Stock', icon: Warehouse, roles: ['manager', 'magasinier'] },
    ],
  },
  {
    label: 'Approvisionnement',
    items: [
      { to: '/fournisseurs', label: 'Fournisseurs', icon: Truck, roles: ['manager', 'magasinier'] },
      { to: '/produits_stock', label: 'Produits stock', icon: PackagePlus, roles: ['manager', 'magasinier'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/utilisateurs', label: 'Utilisateurs', icon: ClipboardList, roles: ['manager'] },
      { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['manager', 'caissier', 'magasinier'] },
      { to: '/mail', label: 'Mail', icon: Mail, roles: ['manager'] },
    ],
  },
  {
    label: 'Analyse',
    items: [
      { to: '/rapports', label: 'Rapports', icon: ChartNoAxesCombined, roles: ['manager', 'caissier', 'magasinier'] },
    ],
  },
];

const navLinkClass = ({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
  isActive
    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-200'
    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
}`;

const childNavLinkClass = ({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
  isActive
    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-200'
    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
}`;

const legacyItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home, roles: ['manager', 'caissier', 'magasinier'] },
  { to: '/clients', label: 'Clients', icon: Users, roles: ['manager', 'caissier'] },
  { to: '/categories', label: 'Categories', icon: FolderTree, roles: ['manager', 'magasinier'] },
  { to: '/produits', label: 'Produits', icon: Package, roles: ['manager', 'caissier', 'magasinier'] },
  { to: '/stock', label: 'Stock', icon: Warehouse, roles: ['manager', 'magasinier'] },
  { to: '/fournisseurs', label: 'Fournisseurs', icon: Truck, roles: ['manager', 'magasinier'] },
  { to: '/produits_stock', label: 'Produits stock', icon: PackagePlus, roles: ['manager', 'magasinier'] },
  { to: '/paniers', label: 'Paniers', icon: ShoppingCart, roles: ['manager', 'caissier'] },
  { to: '/ventes', label: 'Ventes', icon: ReceiptText, roles: ['manager', 'caissier'] },
  { to: '/paiements', label: 'Paiements', icon: CreditCard, roles: ['manager', 'caissier'] },
  { to: '/rapports', label: 'Rapports', icon: ChartNoAxesCombined, roles: ['manager', 'caissier', 'magasinier'] },
  { to: '/utilisateurs', label: 'Utilisateurs', icon: ClipboardList, roles: ['manager'] },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['manager', 'caissier', 'magasinier'] },
  { to: '/mail', label: 'Mail', icon: Mail, roles: ['manager'] },
];

export function Sidebar({ onNavigate }) {
  const role = useSelector(selectUserRole);
  const location = useLocation();
  const navigate = useNavigate();
  const visibleDashboard = canAccess(role, dashboardItem.roles) ? dashboardItem : null;
  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccess(role, item.roles)),
    }))
    .filter((section) => section.items.length > 0);
  const activeSectionLabel = visibleSections.find((section) => section.items.some((item) => (
    location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
  )))?.label;
  const [openSection, setOpenSection] = useState(null);

  useEffect(() => {
    setOpenSection(activeSectionLabel || null);
  }, [activeSectionLabel]);

  const openMenuSection = (section) => {
    setOpenSection(section.label);
    if (section.items[0]) {
      navigate(section.items[0].to);
    }
    onNavigate?.();
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5 dark:border-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 text-white">
          <Boxes size={22} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-950 dark:text-white">Quincaillerie</p>
          <p className="text-xs font-medium text-slate-500">CRM PME</p>
        </div>
      </div>
      <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {visibleDashboard && (() => {
          const Icon = visibleDashboard.icon;
          return (
            <NavLink
              key={visibleDashboard.to}
              to={visibleDashboard.to}
              onClick={() => {
                setOpenSection(null);
                onNavigate?.();
              }}
              className={navLinkClass}
            >
              <Icon size={18} />
              {visibleDashboard.label}
            </NavLink>
          );
        })()}

        {visibleSections.map((section) => {
          const isOpen = openSection === section.label;
          const isActiveGroup = section.label === activeSectionLabel;
          return (
            <div key={section.label} className="space-y-1">
              <button
                type="button"
                onClick={() => openMenuSection(section)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
                  isActiveGroup
                    ? 'text-sky-700 dark:text-sky-200'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                }`}
                aria-expanded={isOpen}
              >
                <span>{section.label}</span>
                <ChevronDown size={16} className={`transition ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              <div
                className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="min-h-0 space-y-1 pl-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => {
                          setOpenSection(section.label);
                          onNavigate?.();
                        }}
                        className={childNavLinkClass}
                        tabIndex={isOpen ? 0 : -1}
                      >
                        <Icon size={18} />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export const items = legacyItems;
