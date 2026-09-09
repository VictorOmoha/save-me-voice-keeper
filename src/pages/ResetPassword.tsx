
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await resetPassword(email);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message || "If an account exists for that email, a password reset link has been sent.");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="workspace-shell min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl bg-card border-border/70 p-2 md:p-4">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-4">
            <img 
              src="/lovable-uploads/a639f87a-4cb3-486d-8907-1bf0d03cc4e4.png" 
              alt="SaveMe"
              className="w-10 h-10 object-contain"
            />
            <span className="text-lg font-semibold text-foreground">
              SaveMe
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-card-foreground">Reset password</h1>
          <CardDescription className="text-muted-foreground">Enter your email to receive a password reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="min-h-11 bg-background border-border text-foreground"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full min-h-11"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Remember your password? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
