export const ROLES = {
  manager: 'Manager',
  caissier: 'Caissier',
  magasinier: 'Magasinier',
};

export const canAccess = (role, roles = []) => roles.length === 0 || roles.includes(role);
