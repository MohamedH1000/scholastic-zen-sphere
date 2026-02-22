import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { signIn, signUp, resetPassword } from "@/lib/supabase-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ArrowRight, Eye, EyeOff, Sparkles, GraduationCap } from "lucide-react";
import authBg from "@/assets/auth-bg.jpg";

type AuthMode = "signin" | "signup" | "forgot";

const Auth = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "forgot") {
        const { error } = await resetPassword(email);
        if (error) throw error;
        toast({ title: "Check your email", description: "We sent you a password reset link." });
        setMode("signin");
      } else if (mode === "signup") {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({ title: "Account created!", description: "Please check your email to verify your account." });
        setMode("signin");
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const titles = {
    signin: "Welcome back",
    signup: "Create your account",
    forgot: "Reset password",
  };

  const subtitles = {
    signin: "Sign in to your student hub",
    signup: "Join thousands of students",
    forgot: "We'll send you a reset link",
  };

  return (
    <div className="flex min-h-screen">
      {/* Left: Art panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={authBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 gradient-bg-hero opacity-60" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="gradient-bg-primary p-2.5 rounded-xl">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-primary-foreground">NextGen</span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h2 className="font-display text-4xl font-bold leading-tight text-primary-foreground mb-4">
              Your all-in-one
              <br />
              <span className="gradient-text">student platform</span>
            </h2>
            <p className="text-primary-foreground/70 text-lg max-w-sm font-body">
              Study smarter, track your progress, and connect with your school community — all in one place.
            </p>
          </motion.div>
          <div className="flex gap-6">
            {["Study Organizer", "SAT Prep", "Wellness", "Community"].map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-primary-foreground/60 text-sm">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="gradient-bg-primary p-2.5 rounded-xl">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">NextGen</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                {titles[mode]}
              </h1>
              <p className="text-muted-foreground mb-8">{subtitles[mode]}</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-foreground">Full name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Smith"
                      required
                      className="h-12 rounded-xl bg-muted/50 border-border/60 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.edu"
                    required
                    className="h-12 rounded-xl bg-muted/50 border-border/60 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                  />
                </div>

                {mode !== "forgot" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-foreground">Password</Label>
                      {mode === "signin" && (
                        <button
                          type="button"
                          onClick={() => setMode("forgot")}
                          className="text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="h-12 rounded-xl bg-muted/50 border-border/60 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-xl gradient-bg-primary text-primary-foreground font-semibold text-base shadow-lg hover:opacity-90 transition-opacity"
                >
                  {submitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <span className="flex items-center gap-2">
                      {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? (
                  <>
                    Don't have an account?{" "}
                    <button onClick={() => setMode("signup")} className="text-primary font-semibold hover:text-primary/80 transition-colors">
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button onClick={() => setMode("signin")} className="text-primary font-semibold hover:text-primary/80 transition-colors">
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Auth;
