import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

export const SuperAdminRoute = ({ children }: SuperAdminRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.super_admin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

