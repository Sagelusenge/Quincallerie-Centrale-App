import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  AlertTriangle,
  BarChart3,
  Bell,
  Box,
  Briefcase,
  Building2,
  ChevronDown,
  CheckCircle2,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FileText,
  FolderPlus,
  Gauge,
  Grid2X2,
  LockKeyhole,
  LogOut,
  LogIn,
  Mail,
  Menu,
  Moon,
  Package,
  Plus,
  Printer,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  SunMedium,
  Tags,
  Trash2,
  UserCog,
  Users,
  WalletCards,
  X
} from 'lucide-react';
import '../styles.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const money = (value) => `${Number(value || 0).toFixed(2)} USD`;

const getInitials = (value = '') => {
  const base = String(value || '').includes('@') ? String(value).split('@')[0] : String(value || '');
  const parts = base.replace(/[._-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
};

const searchPlaceholders = {
  dashboard: 'Rechercher une activite du tableau de bord...',
  clients: 'Rechercher un client, telephone ou statut...',
  produits: 'Rechercher un produit, reference ou categorie...',
  categories: 'Rechercher une categorie...',
  devis: 'Rechercher un devis, client ou statut...',
  ventes: 'Rechercher une facture, client ou montant...',
  paiements: 'Rechercher un paiement, facture ou mode...',
  utilisateurs: 'Rechercher un utilisateur, email ou role...',
  rapports: 'Rechercher dans les rapports...',
  mails: 'Rechercher un email ou destinataire...',
  superadmin: 'Rechercher une entreprise...',
  'admin-entreprises': 'Rechercher une entreprise cliente...',
  'admin-abonnements': 'Rechercher un abonnement...',
  'admin-rapports': 'Rechercher un etat de sortie...',
  'admin-parametres': 'Rechercher un parametre...'
};

const translations = {
  fr: {
    dashboard: 'Tableau de bord',
    clients: 'Clients',
    produits: 'Produits',
    categories: 'Categories',
    devis: 'Devis',
    ventes: 'Ventes',
    paiements: 'Paiements',
    utilisateurs: 'Utilisateurs',
    rapports: 'Rapports',
    mails: 'Emails',
    superadmin: 'Super Admin',
    logout: 'Deconnexion',
    search: 'Rechercher',
    login: 'Connexion',
    forgot: 'Email oublie ?',
    noNotification: 'Aucune notification',
    print: 'Imprimer'
  },
  en: {
    dashboard: 'Dashboard',
    clients: 'Clients',
    produits: 'Products',
    categories: 'Categories',
    devis: 'Quotes',
    ventes: 'Sales',
    paiements: 'Payments',
    utilisateurs: 'Users',
    rapports: 'Reports',
    mails: 'Emails',
    superadmin: 'Super Admin',
    logout: 'Logout',
    search: 'Search',
    login: 'Login',
    forgot: 'Forgot email?',
    noNotification: 'No notifications',
    print: 'Print'
  }
};

const tr = (lang, key) => translations[lang]?.[key] || translations.fr[key] || key;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="app-crash">
          <section>
            <h1>Interface indisponible</h1>
            <p>{this.state.error.message || 'Une erreur est survenue pendant le chargement.'}</p>
            <button className="btn" type="button" onClick={() => window.location.reload()}>Recharger</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

const statusClass = (value) => {
  const text = String(value || '');
  if (text.includes('OK') || text.includes('actif') || text.includes('Paye') || text.includes('converti')) return 'ok';
  if (text.includes('ALERTE') || text.includes('attente') || text.includes('Partiel')) return 'warn';
  if (text.includes('RUPTURE') || text.includes('annule') || text.includes('Impaye') || text.includes('suspendu') || text.includes('Retard') || text.includes('Expire')) return 'danger';
  return '';
};

function Badge({ children }) {
  return <span className={`badge ${statusClass(children)}`}>{children || '-'}</span>;
}

const iconMap = {
  dashboard: Grid2X2,
  clients: Users,
  produits: Box,
  categories: Tags,
  devis: FileText,
  ventes: ShoppingCart,
  paiements: CreditCard,
  rapports: BarChart3,
  utilisateurs: UserCog,
  mails: Mail,
  superadmin: Grid2X2,
  'admin-entreprises': Building2,
  'admin-abonnements': WalletCards,
  'admin-rapports': BarChart3,
  'admin-parametres': Settings
};

function IconButton({ title, children, className = '' }) {
  return <button className={`icon-button ${className}`} title={title} type="button">{children}</button>;
}

function Table({ headers, rows }) {
  if (!rows.length) return <div className="empty">Aucune donnee</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, i) => <td key={i}>{cell ?? '-'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder = 'Rechercher...' }) {
  return (
    <label className="search-field">
      <Search size={18} />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function RowActions({ onEdit, onPrint, onDelete, onToggle, toggleLabel }) {
  return (
    <div className="actions">
      {onEdit && <button className="action edit" type="button" title="Modifier" onClick={onEdit}><Edit3 size={18} /></button>}
      {onPrint && <button className="action print-action" type="button" title="Imprimer" onClick={onPrint}><Printer size={18} /></button>}
      {onToggle && <button className="action toggle" type="button" title={toggleLabel || 'Changer statut'} onClick={onToggle}><CheckCircle2 size={18} /></button>}
      {onDelete && <button className="action delete" type="button" title="Supprimer" onClick={onDelete}><Trash2 size={18} /></button>}
    </div>
  );
}

function printDocument(title, rows) {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  const content = rows.map(([label, value]) => `<tr><th>${label}</th><td>${value ?? '-'}</td></tr>`).join('');
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body{font-family:Arial,sans-serif;padding:32px;color:#111827}
          .print-head{align-items:center;border-bottom:3px solid #002761;display:flex;gap:14px;margin-bottom:24px;padding-bottom:18px}
          .print-logo{align-items:center;background:#002761;border-radius:8px;color:#ffae2b;display:grid;font-size:22px;font-weight:900;height:54px;justify-items:center;width:54px}
          h1{margin:0;font-size:25px;color:#002761}
          .print-sub{color:#64748b;font-size:13px;margin-top:4px}
          table{border-collapse:collapse;width:100%}
          th,td{border-bottom:1px solid #e5e7eb;padding:14px;text-align:left}
          th{width:220px;background:#f8fafc}
        </style>
      </head>
      <body><div class="print-head"><div class="print-logo">CRM</div><div><h1>${title}</h1><div class="print-sub">CRM PME - Document imprime</div></div></div><table>${content}</table></body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('crm_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('crm_user') || 'null'));
  const [authType, setAuthType] = useState(localStorage.getItem('crm_auth_type') || 'user');
  const [page, setPage] = useState('dashboard');
  const [toast, setToast] = useState('');
  const [lang, setLang] = useState(localStorage.getItem('crm_lang') || 'fr');
  const [theme, setTheme] = useState(localStorage.getItem('crm_theme') || 'dark');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [platformSearch, setPlatformSearch] = useState('');
  const [showPasswordSettings, setShowPasswordSettings] = useState(false);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3400);
  };

  const api = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || 'Operation impossible');
    return body;
  };

  useEffect(() => {
    document.body.classList.toggle('theme-light', theme === 'light');
    localStorage.setItem('crm_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('crm_lang', lang);
  }, [lang]);

  useEffect(() => {
    if (!token || authType === 'super_admin') return;
    let cancelled = false;
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => response.json().then((body) => ({ response, body })))
      .then(({ response, body }) => {
        if (!response.ok || !body.user || cancelled) return;
        const refreshedUser = { ...body.user, id: body.user.id_utilisateur, type: 'utilisateur' };
        setUser(refreshedUser);
        localStorage.setItem('crm_user', JSON.stringify(refreshedUser));
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [token, authType]);

  useEffect(() => {
    if (!token) return;
    api('/notifications')
      .then((result) => setNotifications(result.data || []))
      .catch(() => setNotifications([]));
  }, [token, page]);

  const login = async (payload) => {
    const requestLogin = async (path) => {
      const response = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'Identifiants incorrects');
      return body;
    };

    let result;
    let nextAuthType = 'user';
    try {
      result = await requestLogin('/auth/login');
    } catch (userError) {
      try {
        result = await requestLogin('/super-admin/login');
        nextAuthType = 'super_admin';
      } catch (adminError) {
        throw new Error(adminError.message || userError.message || 'Connexion impossible');
      }
    }
    const connectedUser = result.user || result.admin;
    setToken(result.token);
    setUser(connectedUser);
    setAuthType(nextAuthType);
    setPage(nextAuthType === 'super_admin' ? 'superadmin' : 'dashboard');
    localStorage.setItem('crm_token', result.token);
    localStorage.setItem('crm_user', JSON.stringify(connectedUser));
    localStorage.setItem('crm_auth_type', nextAuthType);
    notify('Connexion reussie');
  };

  const logout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    localStorage.removeItem('crm_auth_type');
    setToken('');
    setUser(null);
    setAuthType('user');
    setPage('dashboard');
  };

  const navItems = useMemo(() => {
    if (authType === 'super_admin') return [
      { id: 'superadmin', label: tr(lang, 'dashboard') },
      { id: 'admin-entreprises', label: 'Entreprises' },
      { id: 'admin-abonnements', label: 'Abonnements' },
      { id: 'admin-rapports', label: tr(lang, 'rapports') },
      { id: 'admin-parametres', label: 'Parametres' }
    ];
    const role = user?.role;
    return [
      { id: 'dashboard', label: tr(lang, 'dashboard'), roles: ['manager', 'magasinier'] },
      { id: 'clients', label: tr(lang, 'clients'), roles: ['manager', 'caissier'] },
      { id: 'produits', label: 'Produits & Stocks', roles: ['manager', 'caissier', 'magasinier'] },
      { id: 'categories', label: tr(lang, 'categories'), roles: ['manager', 'magasinier'] },
      { id: 'devis', label: tr(lang, 'devis'), roles: ['manager', 'caissier'] },
      { id: 'ventes', label: 'Factures', roles: ['manager', 'caissier'] },
      { id: 'paiements', label: tr(lang, 'paiements'), roles: ['manager', 'caissier'] },
      { id: 'utilisateurs', label: tr(lang, 'utilisateurs'), roles: ['manager'] },
      { id: 'rapports', label: tr(lang, 'rapports'), roles: ['manager', 'caissier', 'magasinier'] },
      { id: 'mails', label: tr(lang, 'mails'), roles: ['manager'] }
    ].filter((item) => item.roles.includes(role));
  }, [authType, user, lang]);

  useEffect(() => {
    if (token && navItems.length && !navItems.some((item) => item.id === page)) {
      setPage(navItems[0].id);
    }
  }, [token, navItems, page]);

  useEffect(() => {
    setPlatformSearch('');
  }, [page]);

  const openNotificationTarget = async (notification) => {
    setShowNotifications(false);
    if (notification?.id_notification) {
      api(`/notifications/${notification.id_notification}/read`, { method: 'PUT', body: '{}' })
        .then(() => setNotifications((items) => items.map((item) => (
          item.id_notification === notification.id_notification ? { ...item, lu: true } : item
        ))))
        .catch(() => null);
    }
    setShowPasswordSettings(true);
  };

  if (!token) {
    return <Login authType={authType} setAuthType={setAuthType} onLogin={login} notify={notify} toast={toast} lang={lang} />;
  }

  const titles = {
    dashboard: [tr(lang, 'dashboard'), "Bienvenue, voici l'activite de votre entreprise aujourd'hui."],
    clients: ['Clients', 'Fiche client 360 et historique commercial.'],
    produits: ['Produits et stock', 'Catalogue, alertes et reapprovisionnement.'],
    devis: ['Devis', 'Creation et conversion directe en facture.'],
    ventes: ['Ventes et factures', 'Facturation, details et reste a payer.'],
    paiements: ['Paiements', 'Encaissements et rapport caisse.'],
    utilisateurs: ['Utilisateurs', 'Comptes, roles et acces de votre equipe.'],
    mails: ['Emails', 'Envoyer des notifications et messages clients.'],
    categories: ['Categories', 'Classification simple des produits et services.'],
    rapports: ['Rapports', 'Factures, creances, stock et meilleurs clients.'],
    superadmin: ["Vue d'ensemble du reseau", 'Admin > Dashboard Plateforme'],
    'admin-entreprises': ['Entreprises clientes', 'Admin > Entreprises'],
    'admin-abonnements': ['Paiements & abonnements', 'Admin > Abonnements'],
    'admin-rapports': ['Etats de sortie', 'Admin > Rapports'],
    'admin-parametres': ['Parametres plateforme', 'Admin > Parametres']
  };
  const [title, subtitle] = titles[page] || ['CRM PME', ''];
  const isSuperAdmin = authType === 'super_admin';
  const sidebarTitle = isSuperAdmin ? 'CRM PME' : (user?.entreprise_nom || user?.raison_sociale || user?.entreprise_id || 'CRM PME');

  return (
    <div className={`shell ${isSuperAdmin ? 'admin-shell' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          {!isSuperAdmin && <div className="brand-mark">C</div>}
          <div>
            <strong>{sidebarTitle}</strong>
            <span>PME Solutions</span>
          </div>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => setPage(item.id)}>
              {React.createElement(iconMap[item.id] || Package, { size: 23, strokeWidth: 2.2 })}
              {item.label}
            </button>
          ))}
          <button className="nav-logout" type="button" onClick={logout}>
            <LogOut size={23} />
            {tr(lang, 'logout')}
          </button>
        </nav>
      </aside>
      <main className="main">
        <header className={`topbar ${isSuperAdmin ? 'admin-topbar' : ''}`}>
          <SearchInput value={platformSearch} onChange={setPlatformSearch} placeholder={searchPlaceholders[page] || 'Rechercher...'} />
          <div className="toolbar">
            <div className="notification-wrap">
              <button className="icon-button ghost-icon" title="Notifications" type="button" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={22} />
                {notifications.some((n) => !n.lu) && <span className="dot" />}
              </button>
              {showNotifications && (
                <div className="notification-menu">
                  <strong>Notifications</strong>
                  {notifications.length === 0 ? <p>{tr(lang, 'noNotification')}</p> : notifications.map((n) => (
                    <button className="notification-item" key={n.id_notification} type="button" onClick={() => openNotificationTarget(n)}>
                      <b>{n.titre}</b>
                      <span>{n.message}</span>
                      <small>Reconfigurer le mot de passe</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="user-card">
              <div>
                <strong>{user?.nom || user?.email || 'Admin'}</strong>
                <span>{isSuperAdmin ? 'SUPER CONTROL' : (user?.role || user?.type || 'manager')}</span>
              </div>
              <div className="avatar">{getInitials(user?.nom || user?.email || 'U')}</div>
            </div>
          </div>
        </header>
        {!(page === 'dashboard' && !isSuperAdmin) && (
          <section className={`content-heading ${isSuperAdmin ? 'admin-heading' : ''}`}>
            <div>
              {isSuperAdmin && <p className="breadcrumb">{subtitle}</p>}
              <h1>{title}</h1>
              {!isSuperAdmin && <p>{subtitle}</p>}
            </div>
            {isSuperAdmin && page === 'superadmin' && (
              <button className="btn admin-action" type="button" onClick={() => setPage('admin-entreprises')}>
                <FolderPlus size={24} />
                Nouveau Dossier
              </button>
            )}
          </section>
        )}
        <Page page={page} api={api} notify={notify} lang={lang} user={user} searchQuery={platformSearch} />
      </main>
      {showPasswordSettings && (
        <PasswordSettings api={api} notify={notify} user={user} isSuperAdmin={isSuperAdmin} onClose={() => setShowPasswordSettings(false)} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Login({ onLogin, notify, toast }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef(null);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await onLogin(form);
    } catch (error) {
      notify(error.message);
    }
  };

  const togglePassword = () => {
    const input = passwordRef.current;
    const start = input?.selectionStart ?? form.password.length;
    const end = input?.selectionEnd ?? start;
    setShowPassword((value) => !value);
    window.requestAnimationFrame(() => {
      passwordRef.current?.focus();
      passwordRef.current?.setSelectionRange(start, end);
    });
  };

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="login-hero-content">
          <div className="login-hero-brand">
            <Briefcase size={58} />
            <strong>CRM PME</strong>
          </div>
          <h1>Optimisez la gestion de votre PME avec une solution de confiance.</h1>
          <p>La plateforme tout-en-un concue pour les entrepreneurs africains. Gerez vos clients, stocks et facturations en toute simplicite.</p>
          <div className="login-benefits">
            <div>
              <ShieldCheck size={24} />
              <span><strong>Securise</strong><small>Infrastructure robuste</small></span>
            </div>
            <div>
              <Gauge size={24} />
              <span><strong>Performance</strong><small>Temps reel</small></span>
            </div>
          </div>
        </div>
        <div className="login-hero-footer">
          <span>PME SOLUTIONS</span>
          <div className="login-hero-carousel"><i /><i /><i /></div>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-box">
          <h2>Bienvenue</h2>
          <p>Connectez-vous pour acceder a votre espace de gestion.</p>
          <form className="form" onSubmit={submit}>
            <label>Adresse e-mail
              <span className="input-shell">
                <Mail size={22} />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nom@entreprise.com" required />
              </span>
            </label>
            <label>
              <span className="login-label-row">
                Mot de passe
              </span>
              <span className="input-shell">
                <LockKeyhole size={22} />
                <input ref={passwordRef} type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mot de passe" required />
                <button className="password-eye" type="button" onMouseDown={(event) => event.preventDefault()} onClick={togglePassword} title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                  <Eye size={22} />
                </button>
              </span>
            </label>
            <label className="remember-row">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember me
            </label>
            <button className="btn login-submit">Se connecter <LogIn size={20} /></button>
          </form>
          <div className="login-card-footer">Copyright 2026 CRM PME</div>
        </div>
      </section>
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function PasswordSettings({ api, notify, user, isSuperAdmin, onClose }) {
  const [form, setForm] = useState({ new_password: '', confirm_password: '' });

  const save = async () => {
    if (form.new_password !== form.confirm_password) {
      notify('Les mots de passe ne correspondent pas');
      return;
    }
    if (isSuperAdmin) {
      notify('La reconfiguration super admin se fait dans les parametres plateforme');
      onClose();
      return;
    }
    await api('/auth/change-password', { method: 'POST', body: JSON.stringify(form) });
    notify('Mot de passe mis a jour');
    onClose();
  };

  return (
    <Modal title="Reconfiguration du mot de passe" onClose={onClose}>
      <Form onSubmit={() => save().catch((error) => notify(error.message))}>
        <div className="debt-preview">
          <span>Identifiant</span>
          <strong>{user?.email || 'Utilisateur connecte'}</strong>
        </div>
        <Input label="Nouveau mot de passe" type="password" value={form.new_password} onChange={(new_password) => setForm({ ...form, new_password })} required />
        <Input label="Confirmer le mot de passe" type="password" value={form.confirm_password} onChange={(confirm_password) => setForm({ ...form, confirm_password })} required />
        <button className="btn modal-submit" type="submit"><LockKeyhole size={18} /> Mettre a jour</button>
      </Form>
    </Modal>
  );
}

function Page({ page, api, notify, lang, user, searchQuery }) {
  const [data, setData] = useState({ clients: [], produits: [], categories: [], devis: [], ventes: [], extra: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const next = { clients: [], produits: [], categories: [], devis: [], ventes: [], extra: {} };
      const tasks = [];
      const adminPages = ['superadmin', 'admin-entreprises', 'admin-abonnements', 'admin-rapports', 'admin-parametres'];
      if (['clients', 'devis', 'ventes', 'paiements', 'rapports'].includes(page)) tasks.push(api('/clients').then((r) => { next.clients = r.data || []; }));
      if (['produits', 'categories', 'devis', 'ventes', 'rapports'].includes(page)) tasks.push(api('/produits').then((r) => { next.produits = r.data || []; }));
      if (['produits', 'categories', 'devis', 'ventes'].includes(page)) tasks.push(api('/categories').then((r) => { next.categories = r.data || []; }).catch(() => {}));
      if (page === 'devis') tasks.push(api('/devis').then((r) => { next.devis = r.data || []; }));
      if (['ventes', 'paiements'].includes(page)) tasks.push(api('/ventes').then((r) => { next.ventes = r.data || []; }));
      if (page === 'dashboard') {
        tasks.push(api('/clients').then((r) => { next.clients = r.data || []; }).catch(() => {}));
        tasks.push(api('/devis').then((r) => { next.devis = r.data || []; }).catch(() => {}));
        tasks.push(api('/ventes').then((r) => { next.ventes = r.data || []; }).catch(() => {}));
        tasks.push(api('/dashboard/stats').then((r) => { next.extra.stats = r.data || {}; }).catch(() => {}));
        tasks.push(api('/dashboard/ventes-mensuelles').then((r) => { next.extra.ventesMensuelles = r.data || []; }).catch(() => {}));
        tasks.push(api('/dashboard/alertes-stock').then((r) => { next.extra.alertes = r.data || []; }).catch(() => {}));
        tasks.push(api('/dashboard/produits-plus-vendus').then((r) => { next.extra.produitsPlusVendus = r.data || []; }).catch(() => {}));
        tasks.push(api('/produits/mouvements-recents').then((r) => { next.extra.mouvementsStock = r.data || []; }).catch(() => {}));
        tasks.push(api('/paiements/repartition').then((r) => { next.extra.repartitionPaiements = r.data || []; }).catch(() => {}));
        tasks.push(api('/rapports/top-acheteurs').then((r) => { next.extra.top = r.data || []; }).catch(() => {}));
      }
      if (page === 'produits') tasks.push(api('/produits/mouvements-recents').then((r) => { next.extra.mouvementsStock = r.data || []; }).catch(() => {}));
      if (page === 'paiements') tasks.push(api('/paiements/rapport-caisse').then((r) => { next.extra.caisse = r.data || []; }).catch(() => {}));
      if (page === 'utilisateurs') tasks.push(api('/utilisateurs').then((r) => { next.extra.utilisateurs = r.data || []; }));
      if (page === 'mails') {
        tasks.push(api('/mail/status').then((r) => { next.extra.mailStatus = r.data || {}; }).catch(() => {}));
        tasks.push(api('/mail/messages').then((r) => { next.extra.mailMessages = r.data || []; }).catch(() => {}));
      }
      if (page === 'rapports') {
        tasks.push(api('/rapports/factures').then((r) => { next.extra.factures = r.data || []; }));
        tasks.push(api('/rapports/creances').then((r) => { next.extra.creances = r.data || []; }));
        tasks.push(api('/rapports/stock-inventaire').then((r) => { next.extra.stock = r.data || []; }));
        tasks.push(api('/rapports/top-acheteurs').then((r) => { next.extra.top = r.data || []; }).catch(() => {}));
      }
      if (adminPages.includes(page)) {
        tasks.push(api('/super-admin/stats').then((r) => { next.extra.stats = r.data || {}; }));
        tasks.push(api('/super-admin/entreprises').then((r) => { next.extra.entreprises = r.data || []; }));
      }
      await Promise.all(tasks);
      setData(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const submit = async (handler) => {
    try {
      await handler();
      await load();
    } catch (err) {
      notify(err.message);
    }
  };

  if (loading) return <div className="panel">Chargement...</div>;
  if (error) return <p className="notice">{error}</p>;

  const props = { api, notify, data, submit, lang, user, searchQuery };
  if (page === 'dashboard') return <Dashboard data={data} searchQuery={searchQuery} />;
  if (page === 'clients') return <Clients {...props} />;
  if (page === 'produits') return <Produits {...props} />;
  if (page === 'devis') return <Devis {...props} />;
  if (page === 'ventes') return <Ventes {...props} />;
  if (page === 'paiements') return <Paiements {...props} />;
  if (page === 'utilisateurs') return <Utilisateurs {...props} />;
  if (page === 'mails') return <Mails {...props} />;
  if (page === 'categories') return <Categories {...props} />;
  if (page === 'rapports') return <Rapports data={data} searchQuery={searchQuery} />;
  if (page === 'superadmin') return <SuperAdminDashboard {...props} />;
  if (page === 'admin-entreprises') return <SuperAdminEntreprises {...props} />;
  if (page === 'admin-abonnements') return <SuperAdminAbonnements {...props} />;
  if (page === 'admin-rapports') return <SuperAdminRapports data={data} searchQuery={searchQuery} />;
  if (page === 'admin-parametres') return <SuperAdminParametres data={data} />;
  return null;
}

function Dashboard({ data, searchQuery = '' }) {
  const [dashboardFocus, setDashboardFocus] = useState('clients');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('');
  const stats = data.extra.stats || {};
  const ventes = data.extra.ventesMensuelles || [];
  const alertes = data.extra.alertes || [];
  const topClients = (data.extra.top || []).slice(0, 3);
  const topProducts = data.extra.produitsPlusVendus || [];
  const dashboardTerm = searchQuery.trim().toLowerCase();
  const factures = (data.ventes || [])
    .filter((v) => !dashboardTerm || `${v.numero_facture} ${v.client_nom || ''}`.toLowerCase().includes(dashboardTerm))
    .slice(0, 5);
  const devisAttente = (data.devis || []).filter((devis) => String(devis.statut || '').includes('attente')).length;
  const chartMonths = (ventes.length ? ventes.slice(0, 6) : ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin'].map((mois) => ({ mois, total: 0 })));
  const maxVente = Math.max(...chartMonths.map((v) => Number(v.total || 0)), 1);
  const paymentRows = (data.extra.repartitionPaiements || []).map((row) => ({
    mode: row.mode_paiement || row.Mode_Paiement || 'autre',
    label: {
      mobile_money: 'Mobile Money',
      especes: 'Especes',
      virement: 'Virement',
      carte: 'Carte'
    }[row.mode_paiement || row.Mode_Paiement] || (row.mode_paiement || row.Mode_Paiement || 'Autre'),
    total: Number(row.total || row.Total_Encaisse || 0),
    transactions: Number(row.transactions || row.Nombre_Transactions || 0)
  }));
  const paymentTotal = paymentRows.reduce((sum, row) => sum + row.total, 0);
  const paymentPalette = ['#002761', '#9a6400', '#8fb0e8', '#747982', '#ffae2b'];
  const donutParts = paymentRows.reduce((acc, row, index) => {
    const start = acc.cursor;
    const share = paymentTotal > 0 ? (row.total / paymentTotal) * 100 : 0;
    return {
      cursor: start + share,
      segments: [...acc.segments, `${paymentPalette[index % paymentPalette.length]} ${start}% ${start + share}%`]
    };
  }, { cursor: 0, segments: [] }).segments;
  const selectedPayment = paymentRows.find((row) => row.mode === selectedPaymentMode) || paymentRows[0];
  const paymentPercent = paymentTotal > 0 && selectedPayment ? Math.round((selectedPayment.total / paymentTotal) * 100) : 0;
  const focusContent = {
    clients: { title: 'Clients suivis', value: stats.total_clients || data.clients.length || 0, detail: `${topClients.length} clients dans le top portefeuille` },
    ca: { title: 'Chiffre d affaires', value: `USD ${Number(stats.ca_mois_en_cours || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`, detail: `${factures.length} factures visibles` },
    devis: { title: 'Devis a traiter', value: devisAttente || 0, detail: 'Cliquez sur Devis pour convertir les attentes' },
    stock: { title: 'Alertes stock', value: `${alertes.length || 0} produits`, detail: alertes.slice(0, 2).map((item) => item.nom).join(', ') || 'Aucune alerte critique' }
  }[dashboardFocus];
  const invoiceStatus = (vente) => {
    const reste = Number(vente.reste_a_payer || 0);
    const total = Number(vente.montant_ttc || 0);
    if (reste <= 0) return 'PAYE';
    if (reste < total) return 'PARTIEL';
    return 'IMPAYE';
  };

  return (
    <div className="manager-dashboard">
      <div className="grid cols-4 manager-kpis">
        <KpiCard icon={Users} tone="blue" label="Total Clients" value={stats.total_clients || data.clients.length || 0} trend="+12 ce mois" active={dashboardFocus === 'clients'} onClick={() => setDashboardFocus('clients')} />
        <KpiCard icon={CreditCard} tone="orange" label="CA mois en cours" value={`USD ${Number(stats.ca_mois_en_cours || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} trend="+8%" active={dashboardFocus === 'ca'} onClick={() => setDashboardFocus('ca')} />
        <KpiCard icon={FileText} tone="pink" label="Devis en attente" value={devisAttente || 0} trend="A relancer" active={dashboardFocus === 'devis'} onClick={() => setDashboardFocus('devis')} />
        <KpiCard icon={AlertTriangle} tone="danger" label="Alertes stock" value={`${alertes.length || 0} produits`} trend="Urgent" negative active={dashboardFocus === 'stock'} onClick={() => setDashboardFocus('stock')} />
      </div>

      <div className="panel dashboard-focus-panel">
        <span>Detail interactif</span>
        <strong>{focusContent.title}</strong>
        <b>{focusContent.value}</b>
        <p>{focusContent.detail}</p>
      </div>

      <div className="grid manager-mid">
        <div className="panel manager-chart-panel">
          <div className="panel-heading">
            <h3>Ventes des 6 derniers mois</h3>
            <div className="chart-legend">
              <span><i className="sales" /> Activites reelles</span>
            </div>
          </div>
          <div className="activity-chart-shell">
            <div className="chart-lines">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="activity-axis">
              {chartMonths.map((row) => {
                const month = String(row.mois || '').slice(0, 3);
                const value = Number(row.total || 0);
                const height = value > 0 ? Math.max(24, (value / maxVente) * 210) : 8;
                return (
                  <button className="activity-month" key={month} type="button" onClick={() => setDashboardFocus('ca')} title={`Activite ${month}: ${money(value)}`}>
                    <strong>{value > 0 ? formatUsdCompact(value).replace('USD ', '') : '-'}</strong>
                    <div className="activity-track">
                      <i style={{ height }} />
                    </div>
                    <span>{month}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="panel payment-panel">
          <h3>Modes de paiement</h3>
          <div className="donut-wrap">
            <div
              className="payment-donut"
              style={{ background: `radial-gradient(circle closest-side, #fff 66%, transparent 67%), conic-gradient(${donutParts.length ? donutParts.join(', ') : '#e6e8ee 0% 100%'})` }}
              title={selectedPayment ? `${selectedPayment.label}: ${money(selectedPayment.total)}` : 'Aucun paiement'}
            >
              <strong>{paymentPercent}%</strong>
              <span>{selectedPayment?.label || 'AUCUN'}</span>
            </div>
          </div>
          <div className="payment-legend">
            {paymentRows.length ? paymentRows.map((row, index) => (
              <button className={selectedPayment?.mode === row.mode ? 'active' : ''} key={row.mode} type="button" onClick={() => setSelectedPaymentMode(row.mode)}>
                <i style={{ background: paymentPalette[index % paymentPalette.length] }} />
                <span>{row.label}</span>
                <b>{money(row.total)}</b>
              </button>
            )) : <span><i className="card-pay" /> Aucun paiement</span>}
          </div>
        </div>
      </div>

      <div className="grid manager-bottom">
        <div className="panel manager-table-panel">
          <div className="panel-heading">
            <h3>5 dernieres factures</h3>
            <button className="link-button" type="button">Voir tout</button>
          </div>
          <Table headers={['N° Facture', 'Client', 'Date', 'Montant TTC', 'Status', 'Action']} rows={factures.map((v) => [
            v.numero_facture,
            v.client_nom,
            formatDate(v.date_vente || v.date_creation),
            money(v.montant_ttc),
            <Badge>{invoiceStatus(v)}</Badge>,
            <button className="action view-action" type="button" title="Voir"><Eye size={19} /></button>
          ])} />
        </div>

        <div className="panel top-clients-panel">
          <h3>Top 3 Clients</h3>
          <div className="top-client-list">
            {topClients.length ? topClients.map((client, index) => (
              <article key={`${client.nom}-${index}`}>
                <div className="client-avatar">{String(client.nom || 'C').charAt(0).toUpperCase()}</div>
                <div>
                  <strong>{client.nom} {client.postnom || ''}</strong>
                  <span>{client.ville || ['Dakar, Senegal', 'Lagos, Nigeria', "Abidjan, Cote d'Ivoire"][index]}</span>
                </div>
                <div className="client-spend">
                  <strong>{formatUsd(client.ca_total)}</strong>
                  <span>{client.nombre_achats || 0} achats</span>
                </div>
                <em>Derniere visite<br />{index === 0 ? "Aujourd'hui" : index === 1 ? 'Hier' : '3 jours'}</em>
              </article>
            )) : <div className="empty large">Aucun client classe</div>}
          </div>
          <button className="portfolio-link" type="button">Analyse complete du portefeuille <ArrowRight size={20} /></button>
        </div>
      </div>

      <div className="panel top-products-panel">
        <div className="panel-heading">
          <h3>Produits les plus vendus</h3>
          <span className="panel-pill">Top 3</span>
        </div>
        <div className="top-products-chart">
          {topProducts.length ? topProducts.map((product, index) => {
            const maxQty = Math.max(...topProducts.map((p) => Number(p.quantite_vendue || 0)), 1);
            const width = Math.max(18, (Number(product.quantite_vendue || 0) / maxQty) * 100);
            return (
              <article key={product.id_produit || product.nom}>
                <div className="product-rank">{index + 1}</div>
                <div>
                  <strong>{product.nom}</strong>
                  <span>{product.reference_produit || 'Produit'}</span>
                </div>
                <div className="product-bar"><i style={{ width: `${width}%` }} /></div>
                <b>{product.quantite_vendue || 0}</b>
              </article>
            );
          }) : <div className="empty large">Aucune vente produit</div>}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h3>Mouvements stock recents</h3>
          <span className="panel-pill">{(data.extra.mouvementsStock || []).length} mouvements</span>
        </div>
        <Table headers={['Produit', 'Type', 'Quantite', 'Date']} rows={(data.extra.mouvementsStock || []).map((m) => [
          m.produit_nom,
          <Badge>{m.type_mouvement}</Badge>,
          m.quantite,
          formatDate(m.date_mouvement)
        ])} />
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, tone, label, value, trend, negative = false, active = false, onClick }) {
  const trendText = String(trend || '').replace('-', '');
  const trendPrefix = negative || trendText.startsWith('+') || trendText.includes('Total') || /[A-Za-z]/.test(trendText) ? '' : '+ ';
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper className={`card kpi-card ${active ? 'active' : ''}`} type={onClick ? 'button' : undefined} onClick={onClick}>
      <div className="kpi-top">
        <div className={`kpi-icon ${tone}`}>
          <Icon size={30} />
        </div>
        {trend && <span className={`trend ${negative ? 'down' : ''}`}>{trendPrefix}{trendText}</span>}
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
    </Wrapper>
  );
}

function Stat({ label, value }) {
  return <div className="card stat"><span>{label}</span><strong>{value}</strong></div>;
}

function Bar({ label, value, max = 1 }) {
  const h = Math.min(160, Math.max(8, (Number(value || 0) / max) * 150));
  return <div className="bar-item" title={`${label}: ${money(value)}`}><div className="bar-value" style={{ height: h }} /><span>{label}</span></div>;
}

function CreateLauncher({ title, description, buttonLabel, onClick }) {
  return (
    <div className="panel create-launcher">
      <div className="launcher-icon"><Plus size={28} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="btn" type="button" onClick={onClick}>
        <Plus size={18} />
        {buttonLabel}
      </button>
    </div>
  );
}

function LineEditor({ lignes, setLignes, produits }) {
  const update = (index, patch) => {
    setLignes(lignes.map((ligne, i) => i === index ? { ...ligne, ...patch } : ligne));
  };
  const add = () => setLignes([...lignes, { produit_id: produits[0]?.id_produit || '', quantite: 1 }]);
  const remove = (index) => setLignes(lignes.filter((_, i) => i !== index));

  return (
    <div className="line-editor">
      {lignes.map((ligne, index) => (
        <div className="form-row line-row" key={index}>
          <Select label={`Produit ${index + 1}`} value={ligne.produit_id} onChange={(produit_id) => update(index, { produit_id })} options={produits.map((p) => [p.id_produit, `${p.nom} - ${money(p.prix_ht)}`])} />
          <div className="line-qty">
            <Input label="Quantite" type="number" value={ligne.quantite} onChange={(quantite) => update(index, { quantite })} />
            {lignes.length > 1 && <button className="action delete" type="button" onClick={() => remove(index)} title="Supprimer ligne"><Trash2 size={16} /></button>}
          </div>
        </div>
      ))}
      <button className="btn secondary small" type="button" onClick={add}>Ajouter une ligne</button>
    </div>
  );
}

function Clients({ api, notify, data, submit, searchQuery = '' }) {
  const [form, setForm] = useState({ nom: '', postnom: '', telephone: '' });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [history, setHistory] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const term = `${searchQuery} ${query}`.trim().toLowerCase();
  const clients = data.clients
    .filter((c) => `${c.nom} ${c.postnom || ''} ${c.telephone || ''}`.toLowerCase().includes(term))
    .filter((c) => {
      if (statusFilter === 'actifs') return Number(c.nombre_achats || 0) > 0;
      if (statusFilter === 'sans_achat') return Number(c.nombre_achats || 0) === 0;
      if (statusFilter === 'vip') return Number(c.ca_total || 0) >= 1000;
      return true;
    });
  const showHistory = async (client) => {
    try {
      const detail = await api(`/clients/${client.id_client}`);
      setHistory(detail.data);
    } catch (error) {
      notify(error.message);
    }
  };
  const saveEdit = () => submit(async () => {
    await api(`/clients/${editing.id_client}`, { method: 'PUT', body: JSON.stringify(editing) });
    setEditing(null);
    notify('Client mis a jour');
  });
  const remove = (client) => {
    if (!window.confirm(`Supprimer ${client.nom} ?`)) return;
    submit(async () => {
      await api(`/clients/${client.id_client}`, { method: 'DELETE' });
      notify('Client supprime');
    });
  };
  return (
    <div className="grid">
      <div className="panel">
        <div className="panel-heading client-toolbar">
          <h3>Portefeuille clients</h3>
          <div className="actions">
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un client" />
            <select className="compact-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="tous">Tous</option>
              <option value="actifs">Actifs</option>
              <option value="sans_achat">Sans achat</option>
              <option value="vip">VIP</option>
            </select>
            <button className="btn small" type="button" onClick={() => setCreating(true)}><Plus size={16} /> Ajouter client</button>
          </div>
        </div>
        <Table headers={['Nom', 'Telephone', 'Achats', 'CA', 'Actions']} rows={clients.map((c) => [
          `${c.nom} ${c.postnom || ''}`,
          c.telephone || '-',
          c.nombre_achats || 0,
          money(c.ca_total),
          <RowActions
            onEdit={() => setEditing(c)}
            onPrint={() => printDocument('Fiche client', [['Nom', `${c.nom} ${c.postnom || ''}`], ['Telephone', c.telephone || '-'], ['Achats', c.nombre_achats || 0], ['CA', money(c.ca_total)]])}
            onToggle={() => showHistory(c)}
            toggleLabel="Historique"
            onDelete={() => remove(c)}
          />
        ])} />
      </div>
      {creating && (
        <Modal title="Nouveau client" onClose={() => setCreating(false)}>
          <Form onSubmit={() => submit(async () => { await api('/clients', { method: 'POST', body: JSON.stringify(form) }); setForm({ nom: '', postnom: '', telephone: '' }); setCreating(false); notify('Client cree'); })}>
            <div className="form-row">
              <Input label="Nom" value={form.nom} onChange={(nom) => setForm({ ...form, nom })} required />
              <Input label="Postnom" value={form.postnom} onChange={(postnom) => setForm({ ...form, postnom })} />
            </div>
            <Input label="Telephone" value={form.telephone} onChange={(telephone) => setForm({ ...form, telephone })} />
            <button className="btn modal-submit">Enregistrer <ArrowRight size={20} /></button>
          </Form>
        </Modal>
      )}
      {history && (
        <Modal title={`Historique client - ${history.client?.nom || ''}`} onClose={() => setHistory(null)}>
          <Table headers={['Facture', 'Date', 'Montant', 'Paye', 'Reste']} rows={(history.historique || []).map((row) => [
            row.numero_facture,
            formatDate(row.date_vente),
            money(row.montant_ttc),
            money(row.total_paye),
            money(row.reste)
          ])} />
        </Modal>
      )}
      {editing && (
        <Modal title="Modifier client" onClose={() => setEditing(null)}>
          <Form onSubmit={saveEdit}>
            <Input label="Nom" value={editing.nom || ''} onChange={(nom) => setEditing({ ...editing, nom })} required />
            <Input label="Postnom" value={editing.postnom || ''} onChange={(postnom) => setEditing({ ...editing, postnom })} />
            <Input label="Telephone" value={editing.telephone || ''} onChange={(telephone) => setEditing({ ...editing, telephone })} />
            <button className="btn">Mettre a jour</button>
          </Form>
        </Modal>
      )}
    </div>
  );
}

function Produits({ api, notify, data, submit, user, searchQuery = '' }) {
  const [form, setForm] = useState({ reference_produit: '', nom: '', categorie_id: '', prix_ht: '', taux_tva: 16, quantite_stock: 0, seuil_alerte: 5 });
  const [stock, setStock] = useState({ id: '', quantite: 1 });
  const [creating, setCreating] = useState(false);
  const [stocking, setStocking] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const categoryOptions = [['', 'Sans categorie'], ...data.categories.map((c) => [c.id_categorie, c.nom])];
  const canManageProducts = user?.role !== 'caissier';
  const term = `${searchQuery} ${query}`.trim().toLowerCase();
  const produits = data.produits
    .filter((p) => `${p.reference_produit} ${p.nom} ${p.categorie_nom || ''}`.toLowerCase().includes(term))
    .filter((p) => statusFilter === 'tous' || p.statut_stock === statusFilter);
  const saveEdit = () => submit(async () => {
    await api(`/produits/${editing.id_produit}`, { method: 'PUT', body: JSON.stringify(editing) });
    setEditing(null);
    notify('Produit mis a jour');
  });
  const remove = (produit) => {
    if (!window.confirm(`Supprimer ${produit.nom} ?`)) return;
    submit(async () => {
      await api(`/produits/${produit.id_produit}`, { method: 'DELETE' });
      notify('Produit supprime');
    });
  };
  return (
    <>
      <div className="panel">
        <div className="panel-heading product-toolbar">
          <h3>Catalogue</h3>
          <div className="actions">
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher produit ou categorie" />
            <select className="compact-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="tous">Tous les statuts</option>
              <option value="OK">OK</option>
              <option value="ALERTE">Alerte</option>
              <option value="RUPTURE">Rupture</option>
            </select>
            {canManageProducts && <button className="btn small" type="button" onClick={() => setCreating(true)}><Plus size={16} /> Ajouter produit</button>}
            {canManageProducts && <button className="btn secondary small" type="button" onClick={() => setStocking(true)}><Package size={16} /> Mouvement stock</button>}
          </div>
        </div>
        {!canManageProducts && <div className="notice">Votre role permet de consulter les produits, sans ajout ni modification.</div>}
        <div className="product-card-grid">
          {produits.map((p) => (
            <article className="product-card" key={p.id_produit}>
              <div className="product-photo">{String(p.nom || 'P').charAt(0).toUpperCase()}</div>
              <div className="product-card-body">
                <div className="product-card-title">
                  <strong>{p.nom}</strong>
                  <Badge>{p.statut_stock}</Badge>
                </div>
                <p>{p.categorie_nom || 'Sans categorie'} - Ref. {p.reference_produit}</p>
                <div className="product-meta">
                  <span>{money(p.prix_ht)}</span>
                  <span>Stock {p.quantite_stock}</span>
                </div>
                <div className="actions">
                  {canManageProducts && <button className="action edit" type="button" title="Modifier" onClick={() => setEditing(p)}><Edit3 size={17} /></button>}
                  <button className="action print-action" type="button" title="Imprimer" onClick={() => printDocument('Fiche produit', [['Reference', p.reference_produit], ['Produit', p.nom], ['Prix HT', money(p.prix_ht)], ['Stock', p.quantite_stock], ['Statut', p.statut_stock]])}><Printer size={17} /></button>
                  {user?.role === 'manager' && <button className="action delete" type="button" title="Supprimer" onClick={() => remove(p)}><Trash2 size={17} /></button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-heading">
          <h3>Mouvements stock</h3>
          <span className="panel-pill">Dernieres operations</span>
        </div>
        <Table headers={['Produit', 'Reference', 'Type', 'Quantite', 'Date']} rows={(data.extra.mouvementsStock || []).map((m) => [
          m.produit_nom,
          m.reference_produit,
          <Badge>{m.type_mouvement}</Badge>,
          m.quantite,
          formatDate(m.date_mouvement)
        ])} />
      </div>
      {creating && (
        <Modal title="Nouveau produit" onClose={() => setCreating(false)}>
          <Form onSubmit={() => submit(async () => { await api('/produits', { method: 'POST', body: JSON.stringify(form) }); setCreating(false); notify('Produit cree'); })}>
            <div className="form-row">
              <Input label="Reference" value={form.reference_produit} onChange={(reference_produit) => setForm({ ...form, reference_produit })} required />
              <Input label="Designation" value={form.nom} onChange={(nom) => setForm({ ...form, nom })} required />
            </div>
            <Select label="Categorie" value={form.categorie_id} onChange={(categorie_id) => setForm({ ...form, categorie_id })} options={categoryOptions} required={false} />
            <div className="form-row">
              <Input label="Prix HT" type="number" value={form.prix_ht} onChange={(prix_ht) => setForm({ ...form, prix_ht })} required />
              <Input label="TVA %" type="number" value={form.taux_tva} onChange={(taux_tva) => setForm({ ...form, taux_tva })} />
            </div>
            <div className="form-row">
              <Input label="Stock initial" type="number" value={form.quantite_stock} onChange={(quantite_stock) => setForm({ ...form, quantite_stock })} />
              <Input label="Seuil alerte" type="number" value={form.seuil_alerte} onChange={(seuil_alerte) => setForm({ ...form, seuil_alerte })} />
            </div>
            <button className="btn modal-submit">Ajouter <ArrowRight size={20} /></button>
          </Form>
        </Modal>
      )}
      {stocking && (
        <Modal title="Approvisionnement" onClose={() => setStocking(false)}>
          <Form onSubmit={() => submit(async () => { await api(`/produits/${stock.id || data.produits[0]?.id_produit}/approvisionner`, { method: 'POST', body: JSON.stringify({ quantite: stock.quantite }) }); setStocking(false); notify('Stock mis a jour'); })}>
            <Select label="Produit" value={stock.id} onChange={(id) => setStock({ ...stock, id })} options={data.produits.map((p) => [p.id_produit, p.nom])} />
            <Input label="Quantite" type="number" value={stock.quantite} onChange={(quantite) => setStock({ ...stock, quantite })} required />
            <button className="btn modal-submit">Mettre a jour le stock <ArrowRight size={20} /></button>
          </Form>
        </Modal>
      )}
      {editing && (
        <Modal title="Modifier produit" onClose={() => setEditing(null)}>
          <Form onSubmit={saveEdit}>
            <Input label="Designation" value={editing.nom || ''} onChange={(nom) => setEditing({ ...editing, nom })} required />
            <Select label="Categorie" value={editing.categorie_id || ''} onChange={(categorie_id) => setEditing({ ...editing, categorie_id })} options={categoryOptions} required={false} />
            <div className="form-row">
              <Input label="Prix HT" type="number" value={editing.prix_ht || ''} onChange={(prix_ht) => setEditing({ ...editing, prix_ht })} required />
              <Input label="TVA %" type="number" value={editing.taux_tva || 16} onChange={(taux_tva) => setEditing({ ...editing, taux_tva })} />
            </div>
            <Input label="Seuil alerte" type="number" value={editing.seuil_alerte || 5} onChange={(seuil_alerte) => setEditing({ ...editing, seuil_alerte })} />
            <button className="btn">Mettre a jour</button>
          </Form>
        </Modal>
      )}
    </>
  );
}

function Devis({ api, notify, data, submit, searchQuery = '' }) {
  const emptyLine = () => ({ produit_id: data.produits[0]?.id_produit || '', quantite: 1 });
  const [form, setForm] = useState({ client_id: '', lignes: [emptyLine()] });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const term = `${searchQuery} ${query}`.trim().toLowerCase();
  const devisList = data.devis
    .filter((d) => `${d.numero_devis} ${d.client_nom || ''} ${d.client_postnom || ''} ${d.statut || ''}`.toLowerCase().includes(term))
    .filter((d) => statusFilter === 'tous' || d.statut === statusFilter);
  const convert = (id) => submit(async () => {
    const result = await api(`/devis/${id}/convertir`, { method: 'POST', body: '{}' });
    notify(`Facture creee: ${result.facture}`);
  });
  const startEdit = async (devis) => {
    const detail = await api(`/devis/${devis.id_devis}`);
    setEditing({
      ...devis,
      client_id: detail.data.client_id,
      lignes: detail.data.lignes?.length ? detail.data.lignes.map((l) => ({ produit_id: l.produit_id, quantite: l.quantite })) : [emptyLine()]
    });
  };
  const buildLignes = (lignes) => lignes.map((ligne) => {
    const produit = data.produits.find((p) => p.id_produit === ligne.produit_id);
    return { produit_id: ligne.produit_id, quantite: Number(ligne.quantite), prix_unitaire_ht: Number(produit?.prix_ht || 0) };
  });
  const saveEdit = () => submit(async () => {
    await api(`/devis/${editing.id_devis}`, {
      method: 'PUT',
      body: JSON.stringify({
        client_id: editing.client_id,
        lignes: buildLignes(editing.lignes)
      })
    });
    setEditing(null);
    notify('Devis mis a jour');
  });
  const remove = (devis) => {
    if (!window.confirm(`Supprimer le devis ${devis.numero_devis} ?`)) return;
    submit(async () => {
      await api(`/devis/${devis.id_devis}`, { method: 'DELETE' });
      notify('Devis supprime');
    });
  };
  return (
    <div className="grid">
      <div className="panel">
        <div className="panel-heading client-toolbar">
          <h3>Devis</h3>
          <div className="actions">
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un devis" />
            <select className="compact-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="tous">Tous</option>
              <option value="en_attente">En attente</option>
              <option value="converti">Converti</option>
              <option value="annule">Annule</option>
            </select>
            <button className="btn small" type="button" onClick={() => setCreating(true)}><Plus size={16} /> Nouveau devis</button>
          </div>
        </div>
        <Table headers={['Numero', 'Client', 'Montant', 'Statut', 'Actions']} rows={devisList.map((d) => [
          d.numero_devis,
          `${d.client_nom} ${d.client_postnom || ''}`,
          money(d.montant_ttc),
          <Badge>{d.statut}</Badge>,
          <div className="actions">
            {d.statut === 'en_attente' && <button className="btn small" onClick={() => convert(d.id_devis)}>Convertir</button>}
            <RowActions
              onEdit={d.statut === 'en_attente' ? () => startEdit(d) : null}
              onPrint={() => printDocument('Devis', [['Numero', d.numero_devis], ['Client', `${d.client_nom} ${d.client_postnom || ''}`], ['Montant', money(d.montant_ttc)], ['Statut', d.statut]])}
              onDelete={d.statut === 'en_attente' ? () => remove(d) : null}
            />
          </div>
        ])} />
      </div>
      {creating && (
        <Modal title="Nouveau devis" onClose={() => setCreating(false)}>
          <Form onSubmit={() => submit(async () => {
            await api('/devis', { method: 'POST', body: JSON.stringify({ client_id: form.client_id || data.clients[0]?.id_client, lignes: buildLignes(form.lignes) }) });
            setCreating(false);
            notify('Devis cree');
          })}>
            <Select label="Client" value={form.client_id} onChange={(client_id) => setForm({ ...form, client_id })} options={data.clients.map((c) => [c.id_client, `${c.nom} ${c.postnom || ''}`])} />
            <LineEditor lignes={form.lignes} setLignes={(lignes) => setForm({ ...form, lignes })} produits={data.produits} />
            <button className="btn modal-submit">Creer le devis <ArrowRight size={20} /></button>
          </Form>
        </Modal>
      )}
      {editing && (
        <Modal title="Modifier devis" onClose={() => setEditing(null)}>
          <Form onSubmit={saveEdit}>
            <Select label="Client" value={editing.client_id} onChange={(client_id) => setEditing({ ...editing, client_id })} options={data.clients.map((c) => [c.id_client, `${c.nom} ${c.postnom || ''}`])} />
            <LineEditor lignes={editing.lignes} setLignes={(lignes) => setEditing({ ...editing, lignes })} produits={data.produits} />
            <button className="btn">Mettre a jour</button>
          </Form>
        </Modal>
      )}
    </div>
  );
}

function Ventes({ api, notify, data, submit, searchQuery = '' }) {
  const emptyLine = () => ({ produit_id: data.produits[0]?.id_produit || '', quantite: 1 });
  const [form, setForm] = useState({ client_id: '', lignes: [emptyLine()] });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const term = `${searchQuery} ${query}`.trim().toLowerCase();
  const invoiceStatus = (vente) => {
    const reste = Number(vente.reste_a_payer || 0);
    const total = Number(vente.montant_ttc || 0);
    if (reste <= 0) return 'paye';
    if (reste < total) return 'partiel';
    return 'impaye';
  };
  const ventesList = data.ventes
    .filter((v) => `${v.numero_facture} ${v.client_nom || ''} ${v.montant_ttc || ''} ${invoiceStatus(v)}`.toLowerCase().includes(term))
    .filter((v) => statusFilter === 'tous' || invoiceStatus(v) === statusFilter);
  const startEdit = async (vente) => {
    const detail = await api(`/ventes/${vente.id_ventes}`);
    setEditing({
      ...vente,
      client_id: detail.data.client_id,
      lignes: detail.data.lignes?.length ? detail.data.lignes.map((l) => ({ produit_id: l.produit_id, quantite: l.quantite })) : [emptyLine()]
    });
  };
  const saveEdit = () => submit(async () => {
    await api(`/ventes/${editing.id_ventes}`, {
      method: 'PUT',
      body: JSON.stringify({
        client_id: editing.client_id,
        articles: editing.lignes.map((ligne) => ({ produit_id: ligne.produit_id, quantite: Number(ligne.quantite) }))
      })
    });
    setEditing(null);
    notify('Facture mise a jour');
  });
  const remove = (vente) => {
    if (!window.confirm(`Supprimer la facture ${vente.numero_facture} ?`)) return;
    submit(async () => {
      await api(`/ventes/${vente.id_ventes}`, { method: 'DELETE' });
      notify('Facture supprimee');
    });
  };
  return (
    <div className="grid">
      <div className="panel">
        <div className="panel-heading client-toolbar">
          <h3>Factures</h3>
          <div className="actions">
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher facture" />
            <select className="compact-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="tous">Tous</option>
              <option value="paye">Payees</option>
              <option value="partiel">Partielles</option>
              <option value="impaye">Impayees</option>
            </select>
            <button className="btn small" type="button" onClick={() => setCreating(true)}><Plus size={16} /> Nouvelle facture</button>
          </div>
        </div>
        <Table headers={['Facture', 'Client', 'Montant', 'Paye', 'Reste', 'Actions']} rows={ventesList.map((v) => [
          v.numero_facture,
          v.client_nom,
          money(v.montant_ttc),
          money(v.total_paye),
          money(v.reste_a_payer),
          <RowActions
            onEdit={Number(v.total_paye) === 0 ? () => startEdit(v) : null}
            onPrint={() => printDocument('Facture', [['Facture', v.numero_facture], ['Client', v.client_nom], ['Montant', money(v.montant_ttc)], ['Paye', money(v.total_paye)], ['Reste', money(v.reste_a_payer)]])}
            onDelete={Number(v.total_paye) === 0 ? () => remove(v) : null}
          />
        ])} />
      </div>
      {creating && (
        <Modal title="Vente directe" onClose={() => setCreating(false)}>
          <Form onSubmit={() => submit(async () => {
            await api('/ventes', { method: 'POST', body: JSON.stringify({ client_id: form.client_id || data.clients[0]?.id_client, articles: form.lignes.map((ligne) => ({ produit_id: ligne.produit_id, quantite: Number(ligne.quantite) })) }) });
            setCreating(false);
            notify('Facture creee');
          })}>
            <Select label="Client" value={form.client_id} onChange={(client_id) => setForm({ ...form, client_id })} options={data.clients.map((c) => [c.id_client, `${c.nom} ${c.postnom || ''}`])} />
            <LineEditor lignes={form.lignes} setLignes={(lignes) => setForm({ ...form, lignes })} produits={data.produits} />
            <button className="btn modal-submit">Facturer <ArrowRight size={20} /></button>
          </Form>
        </Modal>
      )}
      {editing && (
        <Modal title="Modifier facture" onClose={() => setEditing(null)}>
          <Form onSubmit={saveEdit}>
            <Select label="Client" value={editing.client_id} onChange={(client_id) => setEditing({ ...editing, client_id })} options={data.clients.map((c) => [c.id_client, `${c.nom} ${c.postnom || ''}`])} />
            <LineEditor lignes={editing.lignes} setLignes={(lignes) => setEditing({ ...editing, lignes })} produits={data.produits} />
            <button className="btn">Mettre a jour</button>
          </Form>
        </Modal>
      )}
    </div>
  );
}

function Paiements({ api, notify, data, submit, searchQuery = '' }) {
  const factures = data.ventes.filter((v) => Number(v.reste_a_payer) > 0);
  const [form, setForm] = useState({ vente_id: '', montant: '', mode_paiement: 'especes', reference_externe: '', telephone_payeur: '' });
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const selectedFacture = factures.find((v) => v.id_ventes === (form.vente_id || factures[0]?.id_ventes));
  const term = `${searchQuery} ${query}`.trim().toLowerCase();
  const caisseRows = (data.extra.caisse || []).filter((r) => `${r.Date} ${r.Mode_Paiement} ${r.Total_Encaisse}`.toLowerCase().includes(term));
  return (
    <div className="grid">
      <div className="panel">
        <div className="panel-heading client-toolbar">
          <h3>Caisse du jour</h3>
          <div className="actions">
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher paiement" />
            <button className="btn small" type="button" onClick={() => setCreating(true)}><Plus size={16} /> Nouveau paiement</button>
          </div>
        </div>
        <Table headers={['Date', 'Mode', 'Transactions', 'Total']} rows={caisseRows.map((r) => [r.Date, r.Mode_Paiement, r.Nombre_Transactions, money(r.Total_Encaisse)])} />
      </div>
      {creating && (
        <Modal title="Encaisser un paiement" onClose={() => setCreating(false)}>
          <Form onSubmit={() => submit(async () => { await api('/paiements', { method: 'POST', body: JSON.stringify({ ...form, vente_id: form.vente_id || factures[0]?.id_ventes }) }); setCreating(false); notify('Paiement enregistre'); })}>
            <Select label="Facture" value={form.vente_id} onChange={(vente_id) => setForm({ ...form, vente_id })} options={factures.map((v) => [v.id_ventes, `${v.numero_facture} - reste ${money(v.reste_a_payer)}`])} />
            <div className="form-row">
              <Input label="Montant" type="number" value={form.montant} onChange={(montant) => setForm({ ...form, montant })} required />
              <Select label="Mode" value={form.mode_paiement} onChange={(mode_paiement) => setForm({ ...form, mode_paiement })} options={[['especes', 'Especes'], ['mobile_money', 'Mobile Money'], ['carte', 'Carte'], ['virement', 'Virement']]} />
            </div>
            {selectedFacture && (
              <div className="debt-preview">
                <span>Client debiteur</span>
                <strong>{selectedFacture.client_nom}</strong>
                <em>Reste a payer: {money(selectedFacture.reste_a_payer)}</em>
              </div>
            )}
            <div className="form-row">
              <Input label="Reference" value={form.reference_externe} onChange={(reference_externe) => setForm({ ...form, reference_externe })} />
              <Input label="Telephone payeur" value={form.telephone_payeur} onChange={(telephone_payeur) => setForm({ ...form, telephone_payeur })} />
            </div>
            <button className="btn modal-submit">Enregistrer paiement <ArrowRight size={20} /></button>
          </Form>
        </Modal>
      )}
    </div>
  );
}

function Rapports({ data, searchQuery = '' }) {
  const source = data.extra;
  const term = searchQuery.trim().toLowerCase();
  const factures = (source.factures || []).filter((r) => !term || `${r.numero_facture} ${r.client_nom || ''} ${r.client_postnom || ''}`.toLowerCase().includes(term));
  const creances = (source.creances || []).filter((r) => !term || `${r.numero_facture} ${r.client_nom || ''}`.toLowerCase().includes(term));
  const stock = (source.stock || []).filter((r) => !term || `${r.nom} ${r.statut || ''}`.toLowerCase().includes(term));
  const top = (source.top || []).filter((r) => !term || `${r.nom} ${r.postnom || ''}`.toLowerCase().includes(term));
  const [period, setPeriod] = useState('journalier');
  const printRows = (title, headers, rows) => {
    const win = window.open('', '_blank', 'width=1000,height=720');
    if (!win) return;
    win.document.write(`
      <html><head><title>${title}</title><style>
        body{font-family:Arial,sans-serif;color:#111827;padding:28px}
        h1{font-size:24px;margin:0 0 18px}
        table{border-collapse:collapse;width:100%}
        th,td{border:1px solid #dbe3ef;padding:10px;text-align:left;font-size:13px}
        th{background:#f1f5f9}
      </style></head><body>
      <h1>${title}</h1><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? '-'}</td>`).join('')}</tr>`).join('')}</tbody></table>
      </body></html>
    `);
    win.document.close();
    win.print();
  };
  return (
    <div className="grid">
      <div className="panel report-period-panel">
        <div className="panel-heading">
          <h3>Rapports</h3>
          <select className="compact-filter" value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="journalier">Journalier</option>
            <option value="hebdomadaire">Hebdomadaire</option>
            <option value="mensuel">Mensuel</option>
            <option value="annuel">Annuel</option>
          </select>
        </div>
        <div className="report-cards">
          <Stat label="Periode" value={period} />
          <Stat label="Factures" value={factures.length} />
          <Stat label="Creances" value={creances.length} />
          <Stat label="Produits en stock" value={stock.length} />
        </div>
      </div>
      <div className="panel"><div className="panel-heading"><h3>Creances</h3><button className="btn print" onClick={() => printRows(`Creances - ${period}`, ['Facture', 'Client', 'Du', 'Paye', 'Reste'], creances.map((r) => [r.numero_facture, r.client_nom, money(r.montant_du), money(r.montant_paye), money(r.reste_a_payer)]))}><Printer size={18} /> Imprimer</button></div><Table headers={['Facture', 'Client', 'Du', 'Paye', 'Reste']} rows={creances.map((r) => [r.numero_facture, r.client_nom, money(r.montant_du), money(r.montant_paye), money(r.reste_a_payer)])} /></div>
      <div className="panel"><div className="panel-heading"><h3>Factures</h3><button className="btn print" onClick={() => printRows('Factures', ['Facture', 'Client', 'Montant', 'Reste'], factures.map((r) => [r.numero_facture, `${r.client_nom} ${r.client_postnom || ''}`, money(r.montant_ttc), money(r.reste_a_payer)]))}><Printer size={18} /> Imprimer</button></div><Table headers={['Facture', 'Client', 'Montant', 'Reste']} rows={factures.map((r) => [r.numero_facture, `${r.client_nom} ${r.client_postnom || ''}`, money(r.montant_ttc), money(r.reste_a_payer)])} /></div>
      <div className="grid cols-2">
        <div className="panel"><h3>Inventaire</h3><Table headers={['Produit', 'Stock', 'Valeur', 'Statut']} rows={stock.map((r) => [r.nom, r.quantite_stock, money(r.valeur_stock_ht), <Badge>{r.statut}</Badge>])} /></div>
        <div className="panel"><h3>Top clients</h3><Table headers={['Client', 'Achats', 'CA']} rows={top.map((r) => [`${r.nom} ${r.postnom || ''}`, r.nombre_achats, money(r.ca_total)])} /></div>
      </div>
    </div>
  );
}

function Utilisateurs({ api, notify, data, submit, searchQuery = '' }) {
  const [form, setForm] = useState({ nom: '', email: '', mot_de_passe: 'User@123', role: 'caissier' });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [historyUser, setHistoryUser] = useState(null);
  const [query, setQuery] = useState('');
  const roles = [['manager', 'Manager'], ['caissier', 'Caissier'], ['magasinier', 'Magasinier']];
  const term = `${searchQuery} ${query}`.trim().toLowerCase();
  const users = (data.extra.utilisateurs || []).filter((u) => `${u.nom} ${u.email} ${u.role}`.toLowerCase().includes(term));
  const create = () => submit(async () => {
    await api('/utilisateurs', { method: 'POST', body: JSON.stringify(form) });
    setForm({ nom: '', email: '', mot_de_passe: 'User@123', role: 'caissier' });
    setCreating(false);
    notify('Utilisateur cree et email envoye');
  });
  const saveEdit = () => submit(async () => {
    await api(`/utilisateurs/${editing.id_utilisateur}`, { method: 'PUT', body: JSON.stringify(editing) });
    setEditing(null);
    notify('Utilisateur mis a jour');
  });
  const toggle = (user) => submit(async () => {
    await api(`/utilisateurs/${user.id_utilisateur}/toggle`, { method: 'PUT', body: '{}' });
    notify('Statut modifie');
  });
  const remove = (user) => {
    if (!window.confirm(`Supprimer ${user.nom} ?`)) return;
    submit(async () => {
      await api(`/utilisateurs/${user.id_utilisateur}`, { method: 'DELETE' });
      notify('Utilisateur supprime');
    });
  };

  return (
    <div className="grid">
      <div className="panel">
        <div className="panel-heading client-toolbar">
          <h3>Equipe</h3>
          <div className="actions">
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher utilisateur" />
            <button className="btn small" type="button" onClick={() => setCreating(true)}><Plus size={16} /> Nouvel utilisateur</button>
          </div>
        </div>
        <Table headers={['Nom', 'Email', 'Role', 'Statut', 'Actions']} rows={users.map((u) => [
          u.nom,
          u.email,
          u.role,
          <Badge>{u.actif ? 'actif' : 'suspendu'}</Badge>,
          <RowActions
            onEdit={() => setEditing({ ...u, mot_de_passe: '' })}
            onPrint={() => printDocument('Utilisateur', [['Nom', u.nom], ['Email', u.email], ['Role', u.role], ['Statut', u.actif ? 'actif' : 'suspendu']])}
            onToggle={() => setHistoryUser(u)}
            toggleLabel="Vision et historique"
            onDelete={() => remove(u)}
          />
        ])} />
      </div>
      {creating && (
        <Modal title="Nouvel utilisateur" onClose={() => setCreating(false)}>
          <Form onSubmit={create}>
            <Input label="Nom" value={form.nom} onChange={(nom) => setForm({ ...form, nom })} required />
            <Input label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} required />
            <Input label="Mot de passe temporaire" type="password" value={form.mot_de_passe} onChange={(mot_de_passe) => setForm({ ...form, mot_de_passe })} required />
            <Select label="Role" value={form.role} onChange={(role) => setForm({ ...form, role })} options={roles} />
            <button className="btn modal-submit">Creer et notifier <ArrowRight size={20} /></button>
          </Form>
        </Modal>
      )}
      {editing && (
        <Modal title="Modifier utilisateur" onClose={() => setEditing(null)}>
          <Form onSubmit={saveEdit}>
            <Input label="Nom" value={editing.nom || ''} onChange={(nom) => setEditing({ ...editing, nom })} required />
            <Input label="Email" type="email" value={editing.email || ''} onChange={(email) => setEditing({ ...editing, email })} required />
            <Select label="Role" value={editing.role} onChange={(role) => setEditing({ ...editing, role })} options={roles} />
            <Input label="Nouveau mot de passe optionnel" type="password" value={editing.mot_de_passe || ''} onChange={(mot_de_passe) => setEditing({ ...editing, mot_de_passe })} />
            <button className="btn">Mettre a jour</button>
          </Form>
        </Modal>
      )}
      {historyUser && (
        <Modal title={`Vision utilisateur - ${historyUser.nom}`} onClose={() => setHistoryUser(null)}>
          <div className="user-history">
            <Stat label="Role" value={historyUser.role} />
            <Stat label="Statut" value={historyUser.actif ? 'Actif' : 'Suspendu'} />
            <Stat label="Email" value={historyUser.email} />
          </div>
          <div className="notice">Le journal detaille des actions sera alimente par le module de notification et d'audit applicatif.</div>
          <button className="btn modal-submit" type="button" onClick={() => toggle(historyUser)}>Changer statut</button>
        </Modal>
      )}
    </div>
  );
}

function Mails({ api, notify, data, submit, user, searchQuery = '' }) {
  const status = data.extra.mailStatus || {};
  const [form, setForm] = useState({ to: '', subject: '', message: '' });
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const term = `${searchQuery} ${query}`.trim().toLowerCase();
  const messages = (data.extra.mailMessages || []).filter((row) => `${row.to_email || ''} ${row.sender_email || ''} ${row.subject || ''} ${row.status || ''}`.toLowerCase().includes(term));

  return (
    <div className="grid">
      <div className="panel">
        <div className="panel-heading client-toolbar">
          <h3>Emails envoyes</h3>
          <div className="actions">
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher email" />
            <button className="btn small" type="button" onClick={() => setCreating(true)}><Plus size={16} /> Nouveau message</button>
          </div>
        </div>
        <div className="email-card-list">
          {messages.length ? messages.map((row) => (
            <article className="email-card" key={row.id_mail}>
              <div className="category-icon"><Mail size={24} /></div>
              <div>
                <strong>{row.subject}</strong>
                <p>De {row.sender_email || user?.email || '-'} vers {row.to_email}</p>
                <small>{formatDate(row.created_at)}</small>
              </div>
              <Badge>{row.status || 'envoye'}</Badge>
            </article>
          )) : <div className="empty large">Aucun email envoye</div>}
        </div>
      </div>
      <div className="panel">
        <h3>Configuration email</h3>
        <div className="mail-status">
          <Badge>{status.ready ? 'actif' : 'configuration requise'}</Badge>
          <p>Expediteur courant: <strong>{user?.email || status.sender || 'Email utilisateur indisponible'}</strong></p>
          <p>Les nouveaux utilisateurs et managers recoivent automatiquement un email de bienvenue avec leurs acces temporaires.</p>
        </div>
      </div>
      {creating && (
        <Modal title="Nouveau message" onClose={() => setCreating(false)}>
          <Form onSubmit={() => submit(async () => {
            await api('/mail/send', { method: 'POST', body: JSON.stringify(form) });
            setForm({ to: '', subject: '', message: '' });
            setCreating(false);
            notify('Email envoye');
          })}>
            <div className="debt-preview">
              <span>Expediteur</span>
              <strong>{user?.email || 'Utilisateur en cours'}</strong>
            </div>
            <Input label="Destinataire" type="email" value={form.to} onChange={(to) => setForm({ ...form, to })} required />
            <Input label="Sujet" value={form.subject} onChange={(subject) => setForm({ ...form, subject })} required />
            <label>Message
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </label>
            <button className="btn modal-submit"><Mail size={18} /> Envoyer</button>
          </Form>
        </Modal>
      )}
    </div>
  );
}

function Categories({ api, notify, data, submit, searchQuery = '' }) {
  const [form, setForm] = useState({ nom: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const term = `${searchQuery} ${query}`.trim().toLowerCase();
  const categories = data.categories.filter((c) => `${c.nom} ${c.description || ''}`.toLowerCase().includes(term));
  const save = () => submit(async () => {
    await api('/categories', { method: 'POST', body: JSON.stringify(form) });
    setForm({ nom: '', description: '' });
    setCreating(false);
    notify('Categorie creee');
  });
  const saveEdit = () => submit(async () => {
    await api(`/categories/${editing.id_categorie}`, { method: 'PUT', body: JSON.stringify(editing) });
    setEditing(null);
    notify('Categorie mise a jour');
  });
  const remove = (categorie) => {
    if (!window.confirm(`Supprimer la categorie ${categorie.nom} ?`)) return;
    submit(async () => {
      await api(`/categories/${categorie.id_categorie}`, { method: 'DELETE' });
      notify('Categorie supprimee');
    });
  };

  return (
    <div className="grid">
      <div className="panel">
        <div className="panel-heading client-toolbar">
          <h3>Categories</h3>
          <div className="actions">
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher categorie" />
            <button className="btn small" type="button" onClick={() => setCreating(true)}><Plus size={16} /> Nouvelle categorie</button>
          </div>
        </div>
        <div className="category-list">
          {categories.map((c) => (
            <article className="category-card" key={c.id_categorie}>
              <div className="category-icon"><Tags size={24} /></div>
              <div>
                <strong>{c.nom}</strong>
                <p>{c.description || 'Aucune description'}</p>
              </div>
              <span>{c.total_produits || 0} produits</span>
              <RowActions onEdit={() => setEditing(c)} onDelete={() => remove(c)} />
            </article>
          ))}
        </div>
      </div>
      {creating && (
        <Modal title="Nouvelle categorie" onClose={() => setCreating(false)}>
          <Form onSubmit={save}>
            <Input label="Nom" value={form.nom} onChange={(nom) => setForm({ ...form, nom })} required />
            <Input label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} />
            <button className="btn modal-submit">Enregistrer <ArrowRight size={20} /></button>
          </Form>
        </Modal>
      )}
      {editing && (
        <Modal title="Modifier categorie" onClose={() => setEditing(null)}>
          <Form onSubmit={saveEdit}>
            <Input label="Nom" value={editing.nom || ''} onChange={(nom) => setEditing({ ...editing, nom })} required />
            <Input label="Description" value={editing.description || ''} onChange={(description) => setEditing({ ...editing, description })} />
            <button className="btn">Mettre a jour</button>
          </Form>
        </Modal>
      )}
    </div>
  );
}

const defaultCompanyForm = () => ({
  raison_sociale: '',
  num_id_nationale: '',
  email_entreprise: '',
  ville: '',
  nom_manager: '',
  email_manager: '',
  mdp_manager: 'Manager@123',
  plan: 'plus'
});

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
};

const formatUsd = (value) => `USD ${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const formatUsdCompact = (value) => {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `USD ${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `USD ${(amount / 1000).toFixed(1)}k`;
  return formatUsd(amount);
};

function AdminCompanyStatus({ entreprise }) {
  const days = Number(entreprise.jours_restants ?? 0);
  const suspended = entreprise.statut_abonnement !== 'actif';
  if (suspended) return <Badge>Retard</Badge>;
  if (days < 0) return <Badge>Expire</Badge>;
  return <Badge>Paye</Badge>;
}

function CompanyForm({ form, setForm, onSubmit, mode = 'create' }) {
  const editing = mode === 'edit';
  return (
    <Form onSubmit={onSubmit}>
      <div className="form-row">
        <Input label="Nom de la societe" value={form.raison_sociale || ''} onChange={(raison_sociale) => setForm({ ...form, raison_sociale })} required />
        <Input label="ID national" value={form.num_id_nationale || ''} onChange={(num_id_nationale) => setForm({ ...form, num_id_nationale })} />
      </div>
      <div className="form-row">
        <Input label="Email entreprise" type="email" value={editing ? (form.email || '') : (form.email_entreprise || '')} onChange={(email) => setForm(editing ? { ...form, email } : { ...form, email_entreprise: email })} />
        <Input label="Ville" value={form.ville || ''} onChange={(ville) => setForm({ ...form, ville })} />
      </div>
      {!editing && (
        <>
          <div className="form-row">
            <Input label="Manager" value={form.nom_manager || ''} onChange={(nom_manager) => setForm({ ...form, nom_manager })} required />
            <Input label="Email manager" type="email" value={form.email_manager || ''} onChange={(email_manager) => setForm({ ...form, email_manager })} required />
          </div>
          <Input label="Mot de passe manager" type="password" value={form.mdp_manager || ''} onChange={(mdp_manager) => setForm({ ...form, mdp_manager })} required />
          <div className="subscription-options">
            <button className={`subscription-card ${form.plan === 'plus' ? 'selected' : ''}`} type="button" onClick={() => setForm({ ...form, plan: 'plus' })}>
              <span className="radio-dot" />
              <strong>Enterprise Plus</strong>
              <small>USD 499 / Mois - Illimite</small>
            </button>
            <button className={`subscription-card ${form.plan === 'standard' ? 'selected' : ''}`} type="button" onClick={() => setForm({ ...form, plan: 'standard' })}>
              <span className="radio-dot" />
              <strong>Standard PME</strong>
              <small>USD 149 / Mois - Jusqu'a 50 staff</small>
            </button>
          </div>
        </>
      )}
      <button className="btn modal-submit">{editing ? 'Mettre a jour' : 'Creer entreprise'} <ArrowRight size={20} /></button>
    </Form>
  );
}

function SuperAdminDashboard({ api, notify, data, submit, searchQuery = '' }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(defaultCompanyForm());
  const stats = data.extra.stats || {};
  const term = searchQuery.trim().toLowerCase();
  const entreprises = (data.extra.entreprises || []).filter((e) => !term || `${e.raison_sociale} ${e.email || ''} ${e.ville || ''}`.toLowerCase().includes(term));
  const create = () => submit(async () => {
    await api('/super-admin/entreprises', { method: 'POST', body: JSON.stringify(form) });
    setForm(defaultCompanyForm());
    setCreating(false);
    notify('Entreprise creee');
  });

  return (
    <>
      <div className="grid cols-4 admin-kpis">
        <KpiCard icon={Building2} tone="blue" label="Entreprises Actives" value={Number(stats.entreprises_actives || 0).toLocaleString('fr-FR')} trend="12%" />
        <KpiCard icon={Building2} tone="pink" label="Entreprises Suspendues" value={stats.entreprises_suspendues || 0} trend="2%" negative />
        <KpiCard icon={WalletCards} tone="green" label="Platform CA (Annuel)" value={formatUsdCompact(stats.ca_global)} trend="8.4%" />
        <KpiCard icon={ArrowRight} tone="orange" label="Transactions (Mois)" value={stats.total_ventes || 0} trend={`Total ${formatUsdCompact(stats.ca_global).replace('USD ', '')}`} />
      </div>

      <div className="grid admin-dashboard-main">
        <div className="panel admin-table-panel">
          <div className="panel-heading">
            <h3>Entreprises Recentes</h3>
            <div className="actions">
              <button className="btn secondary small" type="button"><SlidersHorizontal size={16} /> Filtrer</button>
              <button className="btn small" type="button"><Download size={16} /> Exporter</button>
            </div>
          </div>
          <Table headers={['Entreprise', 'Ville', 'Statut', 'Expiration', 'Staff', 'CA Total']} rows={entreprises.slice(0, 5).map((e) => [
            <div><strong>{e.raison_sociale}</strong><span className="muted block">{e.email || 'Logistique & Transport'}</span></div>,
            e.ville || '-',
            <AdminCompanyStatus entreprise={e} />,
            <div><strong>{formatDate(e.date_expiration_abonnement)}</strong><span className={Number(e.jours_restants) < 0 ? 'danger-text block' : 'muted block'}>{Number(e.jours_restants || 0) < 0 ? 'Expire' : `${e.jours_restants || 0} jours restants`}</span></div>,
            e.nb_employes || 0,
            <strong>{formatUsd(e.ca_total)}</strong>
          ])} />
        </div>

        <div className="panel create-company-card">
          <h3>Creer une entreprise</h3>
          <p>Processus d'onboarding partenaire</p>
          <div className="steps">
            <span className="active">1<small>Details</small></span>
            <i />
            <span>2<small>Manager</small></span>
            <i />
            <span>3<small>Fin</small></span>
          </div>
          <div className="fake-field">
            <label>Nom de la societe</label>
            <div>ex: Africa Express S.A.</div>
          </div>
          <div className="subscription-card selected">
            <span className="radio-dot" />
            <strong>Enterprise Plus</strong>
            <small>USD 499 / Mois - Illimite</small>
          </div>
          <button className="btn modal-submit" type="button" onClick={() => setCreating(true)}>
            Continuer vers Etape 2 <ArrowRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid cols-2 admin-graphs">
        <div className="panel">
          <div className="panel-heading">
            <h3>Repartition entreprises</h3>
            <span className="panel-pill">Actives / suspendues</span>
          </div>
          <div className="admin-bars">
            <article><span>Actives</span><i style={{ width: `${Math.min(100, Number(stats.entreprises_actives || 0) / Math.max(Number(stats.total_entreprises || 1), 1) * 100)}%` }} /><b>{stats.entreprises_actives || 0}</b></article>
            <article><span>Suspendues</span><i className="danger-bar" style={{ width: `${Math.min(100, Number(stats.entreprises_suspendues || 0) / Math.max(Number(stats.total_entreprises || 1), 1) * 100)}%` }} /><b>{stats.entreprises_suspendues || 0}</b></article>
          </div>
        </div>
        <div className="panel">
          <div className="panel-heading">
            <h3>Activite plateforme</h3>
            <span className="panel-pill">{stats.total_ventes || 0} transactions</span>
          </div>
          <div className="platform-meter">
            <strong>{formatUsdCompact(stats.ca_global)}</strong>
            <span>Chiffre d'affaires global surveille</span>
          </div>
        </div>
      </div>

      <button className="floating-add" type="button" onClick={() => setCreating(true)} title="Nouvelle entreprise">
        <Plus size={34} />
      </button>

      {creating && (
        <Modal title="Creer une entreprise" onClose={() => setCreating(false)}>
          <CompanyForm form={form} setForm={setForm} onSubmit={create} />
        </Modal>
      )}
    </>
  );
}

function SuperAdminEntreprises({ api, notify, data, submit, searchQuery = '' }) {
  const [form, setForm] = useState(defaultCompanyForm());
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const term = `${searchQuery} ${query}`.trim().toLowerCase();
  const entreprises = (data.extra.entreprises || []).filter((e) => `${e.raison_sociale} ${e.email || ''} ${e.ville || ''}`.toLowerCase().includes(term));
  const create = () => submit(async () => {
    await api('/super-admin/entreprises', { method: 'POST', body: JSON.stringify(form) });
    setForm(defaultCompanyForm());
    setCreating(false);
    notify('Entreprise creee');
  });
  const saveEdit = () => submit(async () => {
    await api(`/super-admin/entreprises/${editing.id_entreprise}`, {
      method: 'PUT',
      body: JSON.stringify({
        raison_sociale: editing.raison_sociale,
        num_id_nationale: editing.num_id_nationale,
        email_entreprise: editing.email,
        ville: editing.ville
      })
    });
    setEditing(null);
    notify('Entreprise mise a jour');
  });
  const toggleSubscription = (entreprise) => submit(async () => {
    const action = entreprise.statut_abonnement === 'actif' ? 'SUSPENDRE' : 'ACTIVER';
    await api(`/super-admin/entreprises/${entreprise.id_entreprise}/abonnement`, { method: 'PUT', body: JSON.stringify({ action, mois: 1 }) });
    notify(action === 'ACTIVER' ? 'Abonnement active' : 'Entreprise suspendue');
  });
  const remove = (entreprise) => {
    if (!window.confirm(`Supprimer ${entreprise.raison_sociale} ?`)) return;
    submit(async () => {
      await api(`/super-admin/entreprises/${entreprise.id_entreprise}`, { method: 'DELETE' });
      notify('Entreprise supprimee');
    });
  };

  return (
    <>
      <div className="panel">
        <div className="panel-heading">
          <h3>Repertoire entreprises</h3>
          <div className="actions">
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher entreprise" />
            <button className="btn" type="button" onClick={() => setCreating(true)}><Plus size={18} /> Nouvelle entreprise</button>
          </div>
        </div>
        <Table headers={['Entreprise', 'Ville', 'Statut', 'Expiration', 'Staff', 'CA', 'Actions']} rows={entreprises.map((e) => [
          <div><strong>{e.raison_sociale}</strong><span className="muted block">{e.email || '-'}</span></div>,
          e.ville || '-',
          <AdminCompanyStatus entreprise={e} />,
          formatDate(e.date_expiration_abonnement),
          e.nb_employes || 0,
          formatUsd(e.ca_total),
          <RowActions
            onEdit={() => setEditing(e)}
            onPrint={() => printDocument('Entreprise', [['Entreprise', e.raison_sociale], ['Ville', e.ville || '-'], ['Statut', e.statut_abonnement], ['Employes', e.nb_employes], ['CA', money(e.ca_total)]])}
            onToggle={() => toggleSubscription(e)}
            toggleLabel={e.statut_abonnement === 'actif' ? 'Suspendre' : 'Activer'}
            onDelete={() => remove(e)}
          />
        ])} />
      </div>
      {creating && (
        <Modal title="Nouvelle entreprise" onClose={() => setCreating(false)}>
          <CompanyForm form={form} setForm={setForm} onSubmit={create} />
        </Modal>
      )}
      {editing && (
        <Modal title="Modifier entreprise" onClose={() => setEditing(null)}>
          <CompanyForm form={editing} setForm={setEditing} onSubmit={saveEdit} mode="edit" />
        </Modal>
      )}
    </>
  );
}

function SuperAdminAbonnements({ api, notify, data, submit, searchQuery = '' }) {
  const [renewing, setRenewing] = useState(null);
  const [months, setMonths] = useState(1);
  const term = searchQuery.trim().toLowerCase();
  const entreprises = (data.extra.entreprises || []).filter((e) => !term || `${e.raison_sociale} ${e.statut_abonnement || ''} ${e.ville || ''}`.toLowerCase().includes(term));
  const renew = () => submit(async () => {
    await api(`/super-admin/entreprises/${renewing.id_entreprise}/abonnement`, { method: 'PUT', body: JSON.stringify({ action: 'ACTIVER', mois: months }) });
    setRenewing(null);
    notify('Abonnement active');
  });
  const suspend = (entreprise) => submit(async () => {
    await api(`/super-admin/entreprises/${entreprise.id_entreprise}/abonnement`, { method: 'PUT', body: JSON.stringify({ action: 'SUSPENDRE', mois: 1 }) });
    notify('Entreprise suspendue');
  });
  return (
    <>
      <div className="grid cols-3">
        <Stat label="Abonnements actifs" value={entreprises.filter((e) => e.statut_abonnement === 'actif').length} />
        <Stat label="Suspendus" value={entreprises.filter((e) => e.statut_abonnement !== 'actif').length} />
        <Stat label="CA abonnements" value={formatUsdCompact((data.extra.stats || {}).ca_global)} />
      </div>
      <div className="panel admin-table-panel" style={{ marginTop: 18 }}>
        <div className="panel-heading">
          <h3>Suivi des abonnements</h3>
          <button className="btn secondary small" type="button"><SlidersHorizontal size={16} /> Filtrer</button>
        </div>
        <Table headers={['Entreprise', 'Plan', 'Statut', 'Expiration', 'Reste', 'CA', 'Actions']} rows={entreprises.map((e) => [
          e.raison_sociale,
          Number(e.nb_employes || 0) > 50 ? 'Enterprise Plus' : 'Standard PME',
          <AdminCompanyStatus entreprise={e} />,
          formatDate(e.date_expiration_abonnement),
          `${e.jours_restants || 0} jours`,
          formatUsd(e.ca_total),
          <div className="actions">
            <button className="btn small" type="button" onClick={() => { setMonths(1); setRenewing(e); }}>Renouveler</button>
            {e.statut_abonnement === 'actif' && <button className="action delete" type="button" title="Suspendre" onClick={() => suspend(e)}><X size={17} /></button>}
          </div>
        ])} />
      </div>
      {renewing && (
        <Modal title={`Renouveler ${renewing.raison_sociale}`} onClose={() => setRenewing(null)}>
          <Form onSubmit={renew}>
            <Select label="Duree" value={months} onChange={(value) => setMonths(Number(value))} options={[[1, '1 mois'], [3, '3 mois'], [6, '6 mois'], [12, '12 mois']]} />
            <button className="btn modal-submit">Valider paiement <WalletCards size={20} /></button>
          </Form>
        </Modal>
      )}
    </>
  );
}

function SuperAdminRapports({ data, searchQuery = '' }) {
  const stats = data.extra.stats || {};
  const term = searchQuery.trim().toLowerCase();
  const entreprises = (data.extra.entreprises || []).filter((e) => !term || `${e.raison_sociale} ${e.ville || ''} ${e.statut_abonnement || ''}`.toLowerCase().includes(term));
  const printReport = () => printDocument('Etat de sortie plateforme', [
    ['Entreprises', stats.total_entreprises || 0],
    ['Actives', stats.entreprises_actives || 0],
    ['Suspendues', stats.entreprises_suspendues || 0],
    ['Transactions', stats.total_ventes || 0],
    ['CA global', money(stats.ca_global)]
  ]);
  return (
    <div className="grid">
      <div className="grid cols-4">
        <Stat label="Total entreprises" value={stats.total_entreprises || 0} />
        <Stat label="Entreprises actives" value={stats.entreprises_actives || 0} />
        <Stat label="Transactions" value={stats.total_ventes || 0} />
        <Stat label="CA global" value={formatUsdCompact(stats.ca_global)} />
      </div>
      <div className="panel admin-table-panel">
        <div className="panel-heading">
          <h3>Etats de sortie</h3>
          <button className="btn" type="button" onClick={printReport}><Printer size={18} /> Imprimer</button>
        </div>
        <Table headers={['Entreprise', 'Ville', 'Employes', 'Ventes', 'CA total', 'Abonnement']} rows={entreprises.map((e) => [
          e.raison_sociale,
          e.ville || '-',
          e.nb_employes || 0,
          e.nb_ventes || 0,
          formatUsd(e.ca_total),
          <AdminCompanyStatus entreprise={e} />
        ])} />
      </div>
    </div>
  );
}

function SuperAdminParametres({ data }) {
  const stats = data.extra.stats || {};
  return (
    <div className="grid cols-2">
      <div className="panel settings-panel">
        <div className="settings-icon"><Settings size={30} /></div>
        <h3>Configuration plateforme</h3>
        <p className="muted">Controle global des entreprises, roles, acces et abonnement SaaS.</p>
        <div className="setting-row"><span>Mode plateforme</span><strong>Production</strong></div>
        <div className="setting-row"><span>Entreprises suivies</span><strong>{stats.total_entreprises || 0}</strong></div>
        <div className="setting-row"><span>Devise</span><strong>USD</strong></div>
      </div>
      <div className="panel settings-panel">
        <div className="settings-icon"><Bell size={30} /></div>
        <h3>Notifications admin</h3>
        <p className="muted">Alertes pour expirations, suspensions et nouveaux dossiers entreprises.</p>
        <div className="setting-row"><span>Expirations abonnement</span><strong>Actif</strong></div>
        <div className="setting-row"><span>Rapports de sortie</span><strong>Hebdomadaire</strong></div>
        <div className="setting-row"><span>Support</span><strong>Aide interne</strong></div>
      </div>
    </div>
  );
}

function Form({ children, onSubmit }) {
  return <form className="form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>{children}</form>;
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="panel-heading">
          <h3>{title}</h3>
          <button className="icon-button ghost-icon" type="button" onClick={onClose} title="Fermer"><X size={20} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required = false }) {
  return <label>{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} /></label>;
}

function Select({ label, value, onChange, options, required = true }) {
  return (
    <label>{label}
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required}>
        {options.map(([id, labelText]) => <option key={id} value={id}>{labelText}</option>)}
      </select>
    </label>
  );
}

createRoot(document.querySelector('#app')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
