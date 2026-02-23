import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/supabase-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import {
  GraduationCap,
  BookOpen,
  Brain,
  Heart,
  Users,
  LogOut,
  TrendingUp,
  CheckCircle2,
  Smile,
  Home,
  Menu,
  Flame,
  Moon,
  Sun,
} from "lucide-react";
import StudyOrganizer from "./dashboard/StudyOrganizer";
import SATCollege from "./dashboard/SATCollege";
import MentalHealth from "./dashboard/MentalHealth";
import Community from "./dashboard/Community";

const modules = [
  {
    id: 'study',
    title: "Study Organizer",
    desc: "Manage tasks & subjects",
    icon: BookOpen,
    gradient: "gradient-bg-primary",
    color: "text-primary"
  },
  {
    id: 'sat',
    title: "SAT & College",
    desc: "Quizzes, GPA & colleges",
    icon: GraduationCap,
    gradient: "gradient-bg-secondary",
    color: "text-secondary"
  },
  {
    id: 'wellness',
    title: "Mental Health",
    desc: "Mood, journal & music",
    icon: Heart,
    gradient: "from-success to-emerald-400 bg-gradient-to-br",
    color: "text-success"
  },
  {
    id: 'community',
    title: "Community",
    desc: "Posts, clubs & more",
    icon: Users,
    gradient: "from-warning to-amber-400 bg-gradient-to-br",
    color: "text-warning"
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const sidebarVariants = {
  hidden: { x: -300 },
  visible: { x: 0 },
  exit: { x: -300 }
};

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    tasksToday: 0,
    gpa: 0,
    mood: null,
    satScore: null
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch today's tasks
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id)
        .gte('due_date', today.toISOString())
        .order('due_date', { ascending: true })
        .limit(5);

      if (tasksData) {
        setRecentTasks(tasksData);
        setStats(prev => ({ ...prev, tasksToday: tasksData.length }));
      }

      // Fetch GPA
      const { data: gpaData } = await supabase
        .from('gpa_history')
        .select('cumulative_gpa')
        .eq('user_id', user?.id)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (gpaData) {
        setStats(prev => ({ ...prev, gpa: gpaData.cumulative_gpa || 0 }));
      }

      // Fetch latest mood
      const { data: moodData } = await supabase
        .from('mood_entries')
        .select('mood, emoji')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (moodData) {
        setStats(prev => ({ ...prev, mood: moodData }));
      }

      // Fetch SAT score
      const { data: satData } = await supabase
        .from('quiz_results')
        .select('score')
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (satData) {
        setStats(prev => ({ ...prev, satScore: satData.score * 10 }));
      }

      // Calculate streak (mock for now)
      setStreak(7);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent"
        />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "morning" : greetingHour < 18 ? "afternoon" : "evening";

  const renderSidebar = (mobile = false) => (
    <motion.div
      variants={mobile ? undefined : sidebarVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex flex-col h-full ${mobile ? 'w-72' : 'w-64'} bg-card border-r border-border`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="gradient-bg-primary p-2.5 rounded-xl"
          >
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </motion.div>
          <div>
            <span className="font-display text-lg font-bold text-foreground block">NextGen</span>
            <span className="text-xs text-muted-foreground">Student Hub</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          <Button
            variant={!activeModule ? "secondary" : "ghost"}
            className={`w-full justify-start ${!activeModule ? "bg-secondary/20" : ""}`}
            onClick={() => {
              setActiveModule(null);
              if (mobile) setSidebarOpen(false);
            }}
          >
            <Home className="h-4 w-4 mr-3" />
            Dashboard
          </Button>

          <Separator className="my-3" />

          <p className="px-3 text-xs font-semibold text-muted-foreground mb-2">MODULES</p>

          {modules.map((mod) => (
            <Button
              key={mod.id}
              variant={activeModule === mod.id ? "secondary" : "ghost"}
              className={`w-full justify-start ${activeModule === mod.id ? "bg-secondary/20" : ""}`}
              onClick={() => {
                setActiveModule(mod.id);
                if (mobile) setSidebarOpen(false);
              }}
            >
              <mod.icon className={`h-4 w-4 mr-3 ${activeModule === mod.id ? mod.color : ""}`} />
              {mod.title}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* User section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full gradient-bg-primary flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-foreground">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'study': return <StudyOrganizer />;
      case 'sat': return <SATCollege />;
      case 'wellness': return <MentalHealth />;
      case 'community': return <Community />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        {renderSidebar(false)}
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="absolute inset-y-0 left-0">
              {renderSidebar(true)}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-md">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  {renderSidebar(true)}
                </SheetContent>
              </Sheet>

              <h1 className="font-display text-xl font-semibold text-foreground">
                {activeModule ? modules.find(m => m.id === activeModule)?.title : 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Streak */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20"
              >
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">{streak} day streak</span>
              </motion.div>

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <ScrollArea className="flex-1">
          <main className="container mx-auto px-4 lg:px-6 py-6 lg:py-8">
            <AnimatePresence mode="wait">
              {!activeModule ? (
                <motion.div
                  key="dashboard"
                  variants={container}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, y: -20 }}
                >
                  {/* Welcome */}
                  <motion.div variants={item} className="mb-8">
                    <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2">
                      Good {greetingHour < 12 ? "morning" : greetingHour < 18 ? "afternoon" : "evening"}, {displayName} 👋
                    </h1>
                    <p className="text-muted-foreground">Here's your student dashboard overview.</p>
                  </motion.div>

                  {/* Stats */}
                  <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <motion.div
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="glass-card p-5 cursor-pointer"
                      onClick={() => setActiveModule('study')}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">Tasks Today</span>
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="font-display text-2xl font-bold text-foreground">{stats.tasksToday}</p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="glass-card p-5 cursor-pointer"
                      onClick={() => setActiveModule('sat')}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">GPA</span>
                        <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="font-display text-2xl font-bold text-foreground">
                        {stats.gpa > 0 ? stats.gpa.toFixed(2) : '—'}
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="glass-card p-5 cursor-pointer"
                      onClick={() => setActiveModule('wellness')}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">Mood</span>
                        <div className="p-2 rounded-lg bg-success/10 text-success">
                          <Smile className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="font-display text-2xl font-bold text-foreground">
                        {stats.mood?.emoji || '—'}
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="glass-card p-5 cursor-pointer"
                      onClick={() => setActiveModule('sat')}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">SAT Score</span>
                        <div className="p-2 rounded-lg bg-accent/10 text-accent">
                          <Brain className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="font-display text-2xl font-bold text-foreground">
                        {stats.satScore || '—'}
                      </p>
                    </motion.div>
                  </motion.div>

                  {/* Quick Actions */}
                  <motion.div variants={item}>
                    <h2 className="font-display text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {modules.map((mod) => (
                        <motion.div
                          key={mod.title}
                          whileHover={{ y: -4, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="glass-card-elevated p-6 cursor-pointer group"
                          onClick={() => setActiveModule(mod.id)}
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
                </motion.div>
              ) : (
                <motion.div
                  key={activeModule}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderActiveModule()}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Dashboard;
