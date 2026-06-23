import { Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  children: React.ReactNode;
  adminOnly?: boolean;
};

export function ProtectedRoute({
  children,
  adminOnly = false
}: Props) {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}