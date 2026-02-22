import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/supabase-auth";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  BookOpen,
  Brain,
  Heart,
  Users,
  LogOut,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Smile,
} from "lucide-react";

const statCards = [
  { label: "Tasks Today", value: "5", icon: CheckCircle2, color: "bg-primary/10 text-primary" },
  { label: "GPA", value: "3.75", icon: TrendingUp, color: "bg-secondary/10 text-secondary" },
  { label: "Mood", value: "😊", icon: Smile, color: "bg-success/10 text-success" },
  { label: "SAT Score", value: "1420", icon: Brain, color: "bg-accent/10 text-accent" },
];

const modules = [
  { title: "Study Organizer", desc: "Manage tasks & subjects", icon: BookOpen, gradient: "gradient-bg-primary" },
  { title: "SAT & College", desc: "Quizzes, GPA & colleges", icon: GraduationCap, gradient: "gradient-bg-secondary" },
  { title: "Mental Health", desc: "Mood, journal & music", icon: Heart, gradient: "from-success to-emerald-400 bg-gradient-to-br" },
  { title: "Community", desc: "Posts, clubs & more", icon: Users, gradient: "from-warning to-amber-400 bg-gradient-to-br" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="gradient-bg-primary p-2 rounded-lg">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">NextGen</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Hey, <span className="font-semibold text-foreground">{displayName}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div variants={container} initial="hidden" animate="show">
          {/* Welcome */}
          <motion.div variants={item} className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {displayName} 👋
            </h1>
            <p className="text-muted-foreground">Here's your student dashboard overview.</p>
          </motion.div>

          {/* Stats */}
          <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat) => (
              <div key={stat.label} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Modules */}
          <motion.div variants={item}>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">Explore Modules</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {modules.map((mod) => (
                <motion.div
                  key={mod.title}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="glass-card-elevated p-6 cursor-pointer group"
                >
                  <div className={`${mod.gradient} p-3 rounded-xl w-fit mb-4`}>
                    <mod.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-1">{mod.title}</h3>
                  <p className="text-sm text-muted-foreground">{mod.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Placeholder sections */}
          <motion.div variants={item} className="mt-8 glass-card p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">More features coming soon</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Tasks, quizzes, mood tracking, journal, community posts, and much more are on the way. Stay tuned!
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
