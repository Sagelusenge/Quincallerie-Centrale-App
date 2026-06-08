import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUserRole } from './authSlice.js';
import { canAccess } from '../../utils/roles.js';

export function RequireRole({ roles, children }) {
  const role = useSelector(selectUserRole);

  if (!canAccess(role, roles)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
