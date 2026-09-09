import { Link, useLocation } from "react-router-dom";
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const {user} = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="workspace-shell min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md text-center">
        <p className="mb-4 text-sm font-medium text-primary">404</p>
        <h1 className="text-3xl font-semibold mb-3">Page not found</h1>
        <p className="text-muted-foreground mb-6">This link may have changed. Head back to SaveMe to continue.</p>
        <Button asChild className="min-h-11"><Link to={user ? '/dashboard' : '/'}>
          {user ? 'Back to dashboard' : 'Back to SaveMe'}
        </Link></Button>
      </div>
    </div>
  );
};

export default NotFound;
