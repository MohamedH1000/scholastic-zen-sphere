import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Brain, Heart, Users, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  {
    icon: BookOpen,
    title: "Study Organizer",
    desc: "Track tasks, manage subjects, and never miss a deadline.",
  },
  {
    icon: Brain,
    title: "SAT & College Prep",
    desc: "Timed quizzes, GPA calculator, and college explorer.",
  },
  {
    icon: Heart,
    title: "Mental Wellness",
    desc: "Mood tracker, private journal, and study music.",
  },
  {
    icon: Users,
    title: "Community",
    desc: "Connect with classmates, clubs, and school events.",
  },
];

const benefits = [
  "Replace 5+ apps with one dashboard",
  "Built by students, for students",
  "100% free to use",
  "Private & secure",
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="gradient-bg-primary p-2 rounded-lg">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">NextGen</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Sign in
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="gradient-bg-primary text-primary-foreground rounded-xl px-5 hover:opacity-90 transition-opacity">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Built for American school students
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6">
              Your school life,{" "}
              <span className="gradient-text">all in one place</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10">
              Study smarter, ace the SAT, track your wellness, and connect with your school community — one powerful dashboard.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="gradient-bg-primary text-primary-foreground rounded-xl px-8 h-13 text-base font-semibold hover:opacity-90 transition-opacity">
                  Start for free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits strip */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-14"
          >
            <motion.h2 variants={item} className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to{" "}
              <span className="gradient-text">succeed</span>
            </motion.h2>
            <motion.p variants={item} className="text-muted-foreground text-lg max-w-md mx-auto">
              Four powerful modules designed around your student life.
            </motion.p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                variants={item}
                whileHover={{ y: -6 }}
                className="glass-card-elevated p-7 text-center group cursor-pointer"
              >
                <div className="gradient-bg-primary p-4 rounded-2xl w-fit mx-auto mb-5 group-hover:scale-110 transition-transform">
                  <feat.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="gradient-bg-hero rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to level up your school game?
              </h2>
              <p className="text-primary-foreground/70 text-lg mb-8 max-w-md mx-auto">
                Join NextGen Student Hub today and take control of your academic journey.
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-primary-foreground text-foreground rounded-xl px-8 h-13 text-base font-semibold hover:bg-primary-foreground/90 transition-colors">
                  Get started — it's free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} NextGen Student Hub. Built with ❤️ for students.
        </div>
      </footer>
    </div>
  );
};

export default Index;
