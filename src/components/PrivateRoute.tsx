import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border border-border flex items-center justify-center mx-auto mb-4 animate-pulse rounded-lg">
            <span className="text-primary text-lg font-semibold">S</span>
          </div>
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const hashPath = typeof window !== "undefined" && window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "/login";
    const next = hashPath || "/login";
    return <Navigate to={next === "/login" ? "/login" : `/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
