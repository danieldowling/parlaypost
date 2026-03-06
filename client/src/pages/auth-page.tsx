import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { MessageSquareText, TrendingUp, Trophy, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login({ email, password });
        toast({ title: "Welcome back!", description: "Successfully logged in." });
      } else {
        await register({ email, password, name });
        toast({ title: "Account created!", description: "Welcome to ParlayPost." });
      }
      setLocation("/");
    } catch (err: any) {
      toast({ 
        title: "Authentication Error", 
        description: err.message || "An error occurred", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
      {/* Left side - Branding/Hero */}
      <div className="hidden md:flex md:w-1/2 bg-card relative overflow-hidden flex-col justify-center p-12 border-r border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent z-0" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center mb-8">
            <MessageSquareText className="w-12 h-12 text-primary mr-4" />
            <h1 className="text-5xl font-display font-bold text-gradient">ParlayPost</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-12">
            Text your bets. We track the rest. Join the ultimate platform for sports bettors to track performance and compete with friends.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center text-foreground">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mr-4">
                <MessageSquareText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">SMS Integration</h3>
                <p className="text-muted-foreground">Just text "$50 Knicks -4.5" to log it automatically.</p>
              </div>
            </div>
            <div className="flex items-center text-foreground">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mr-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Smart Dashboard</h3>
                <p className="text-muted-foreground">Visualize your ROI and win percentage over time.</p>
              </div>
            </div>
            <div className="flex items-center text-foreground">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mr-4">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Group Leaderboards</h3>
                <p className="text-muted-foreground">Create groups and see who is the most profitable.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-8 left-8 md:hidden flex items-center">
          <MessageSquareText className="w-8 h-8 text-primary mr-2" />
          <span className="text-2xl font-bold font-display text-gradient">ParlayPost</span>
        </div>

        <Card className="w-full max-w-md p-8 glass-card border-border/50">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin ? "Enter your credentials to access your dashboard" : "Sign up to start tracking your bets"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <FormField
                label="Full Name"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required={!isLogin}
              />
            )}
            <FormField
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
            <FormField
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button 
              type="submit" 
              className="w-full py-6 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all"
              disabled={isLoggingIn || isRegistering}
            >
              {isLogin 
                ? (isLoggingIn ? "Signing in..." : "Sign In") 
                : (isRegistering ? "Creating account..." : "Create Account")}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:text-primary/80 font-semibold hover:underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-border/40 flex justify-center gap-4 text-xs text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms &amp; Conditions</a>
          </div>
        </Card>
      </div>
    </div>
  );
}
