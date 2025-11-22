import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import GoogleSignInButton from "@/components/GoogleSignInButton";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, signInWithGoogle, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email, password);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Welcome back!");
      navigate("/dashboard");
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const result = await signInWithGoogle();
    
    if (result.error) {
      toast.error(result.error);
      setIsGoogleLoading(false);
    } else {
      toast.success("Signing in with Google...");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-4">
            <img 
              src="/lovable-uploads/a639f87a-4cb3-486d-8907-1bf0d03cc4e4.png" 
              alt="Save Me Logo" 
              className="w-16 h-16 object-contain"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Save Me
            </span>
          </div>
          <CardTitle className="text-2xl text-card-foreground">Welcome Back</CardTitle>
          <CardDescription className="text-muted-foreground">Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleSignInButton
            onSignIn={handleGoogleSignIn}
            isLoading={isGoogleLoading}
            text="Sign in with Google"
          />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-background border-border text-foreground"
              />
            </div>
            <Button 
              type="submit" 
              variant="gradient"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link to="/reset-password" className="text-primary hover:underline font-medium">
              Forgot your password?
            </Link>
          </div>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
