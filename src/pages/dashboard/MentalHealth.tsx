import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Heart,
  Smile,
  Meh,
  Frown,
  BookOpen,
  Music,
  Sparkles,
  Plus,
  Calendar,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MOOD_OPTIONS = [
  { value: 'amazing', emoji: '😄', label: 'Amazing', color: 'hsl(152, 60%, 45%)', icon: Smile },
  { value: 'good', emoji: '🙂', label: 'Good', color: 'hsl(142, 71%, 45%)', icon: Smile },
  { value: 'okay', emoji: '😐', label: 'Okay', color: 'hsl(45, 93%, 47%)', icon: Meh },
  { value: 'bad', emoji: '😔', label: 'Bad', color: 'hsl(25, 95%, 53%)', icon: Frown },
  { value: 'terrible', emoji: '😢', label: 'Terrible', color: 'hsl(0, 72%, 51%)', icon: Frown },
];

const ACTIVITIES = [
  'Exercise', 'Meditation', 'Reading', 'Music', 'Friends', 'Nature', 'Gaming', 'Art',
  'Cooking', 'Sports', 'Sleep', 'Study', 'Volunteer', 'Other',
];

const YOUTUBE_PLAYLIST = "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0&loop=1&playlist=jfKfPfyJRdk";

const MentalHealth = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('mood');
  const [moodEntries, setMoodEntries] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [dailyQuote, setDailyQuote] = useState<any>(null);
  const [selectedMood, setSelectedMood] = useState<any>(null);
  const [moodNote, setMoodNote] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  // Journal states
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<any>(null);
  const [journalForm, setJournalForm] = useState({
    title: '',
    content: '',
    tags: [],
    mood_before: '',
    mood_after: '',
  });

  useEffect(() => {
    if (user) {
      fetchMoodEntries();
      fetchJournalEntries();
      fetchQuotes();
      checkTodayMood();
    }
  }, [user]);

  const checkTodayMood = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setSelectedMood(MOOD_OPTIONS.find(m => m.value === data.mood));
      }
    } catch (error) {
      console.error('Error checking today\'s mood:', error);
    }
  };

  const fetchMoodEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setMoodEntries(data || []);
    } catch (error: any) {
      console.error('Error fetching mood entries:', error);
    }
  };

  const fetchJournalEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setJournalEntries(data || []);
    } catch (error: any) {
      console.error('Error fetching journal entries:', error);
    }
  };

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*');

      if (error) throw error;
      setQuotes(data || []);

      // Set daily quote based on day of year
      const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
      const quoteIndex = dayOfYear % (data?.length || 1);
      setDailyQuote(data?.[quoteIndex] || null);
    } catch (error: any) {
      console.error('Error fetching quotes:', error);
    }
  };

  const handleLogMood = async () => {
    if (!selectedMood) {
      toast({ title: 'Error', description: 'Please select your mood', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('mood_entries').insert({
        user_id: user?.id,
        mood: selectedMood.value,
        emoji: selectedMood.emoji,
        note: moodNote,
        activities: selectedActivities,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Mood logged successfully' });
      setMoodNote('');
      setSelectedActivities([]);
      fetchMoodEntries();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleCreateJournal = async () => {
    try {
      const { error } = await supabase.from('journal_entries').insert({
        user_id: user?.id,
        title: journalForm.title,
        content: journalForm.content,
        tags: journalForm.tags,
        mood_before: journalForm.mood_before,
        mood_after: journalForm.mood_after,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Journal entry saved' });
      setJournalDialogOpen(false);
      resetJournalForm();
      fetchJournalEntries();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdateJournal = async () => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({
          title: journalForm.title,
          content: journalForm.content,
          tags: journalForm.tags,
          mood_before: journalForm.mood_before,
          mood_after: journalForm.mood_after,
        })
        .eq('id', editingJournal.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Journal entry updated' });
      setJournalDialogOpen(false);
      setEditingJournal(null);
      resetJournalForm();
      fetchJournalEntries();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteJournal = async (id: string) => {
    try {
      const { error } = await supabase.from('journal_entries').delete().eq('id', id);
      if (error) throw error;

      toast({ title: 'Success', description: 'Journal entry deleted' });
      fetchJournalEntries();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const openEditJournal = (entry: any) => {
    setEditingJournal(entry);
    setJournalForm({
      title: entry.title,
      content: entry.content,
      tags: entry.tags || [],
      mood_before: entry.mood_before || '',
      mood_after: entry.mood_after || '',
    });
    setJournalDialogOpen(true);
  };

  const resetJournalForm = () => {
    setJournalForm({
      title: '',
      content: '',
      tags: [],
      mood_before: '',
      mood_after: '',
    });
  };

  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const getMoodTrend = () => {
    if (moodEntries.length < 2) return 'neutral';
    const recent = moodEntries.slice(0, 7);
    const moodValues = recent.map(e => {
      const index = MOOD_OPTIONS.findIndex(m => m.value === e.mood);
      return (MOOD_OPTIONS.length - 1 - index);
    });
    const avg = moodValues.reduce((a, b) => a + b, 0) / moodValues.length;
    if (avg > 2.5) return 'up';
    if (avg < 1.5) return 'down';
    return 'neutral';
  };

  const moodTrend = getMoodTrend();

  // Chart data
  const chartData = moodEntries.slice(0, 14).reverse().map(entry => ({
    date: new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    mood: MOOD_OPTIONS.findIndex(m => m.value === entry.mood),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Mental Health & Wellness</h2>
        <p className="text-muted-foreground">Track your mood, journal your thoughts, and relax</p>
      </div>

      {/* Daily Quote */}
      {dailyQuote && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 relative overflow-hidden"
        >
          <div className="absolute top-4 right-4">
            <Sparkles className="h-6 w-6 text-primary/40" />
          </div>
          <div className="relative z-10">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-medium text-foreground italic">"{dailyQuote.text}"</p>
                <p className="text-sm text-muted-foreground mt-2">— {dailyQuote.author || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mood Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Mood</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selectedMood?.emoji || '—'}</span>
              <div>
                <p className="font-semibold text-foreground">{selectedMood?.label || 'Not logged'}</p>
                {moodTrend === 'up' && (
                  <p className="text-xs text-success flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Improving
                  </p>
                )}
                {moodTrend === 'down' && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Declining
                  </p>
                )}
                {moodTrend === 'neutral' && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Minus className="h-3 w-3" /> Stable
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-bold text-foreground">{moodEntries.length > 0 ? moodEntries.filter(e => {
              const entryDate = new Date(e.created_at);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return entryDate > weekAgo;
            }).length : 0}</p>
            <p className="text-sm text-muted-foreground">entries logged</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Journal Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-bold text-foreground">{journalEntries.length}</p>
            <p className="text-sm text-muted-foreground">total reflections</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mood">Mood Tracker</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="relax">Relax & Music</TabsTrigger>
        </TabsList>

        {/* Mood Tracker Tab */}
        <TabsContent value="mood" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>How are you feeling today?</CardTitle>
              <CardDescription>Track your mood to see patterns over time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-5 gap-3">
                {MOOD_OPTIONS.map((mood) => (
                  <motion.button
                    key={mood.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedMood(mood)}
                    className={`p-4 rounded-xl border-2 transition-all ${selectedMood?.value === mood.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-border/80'
                      }`}
                  >
                    <span className="text-3xl block mb-2">{mood.emoji}</span>
                    <span className="text-xs font-medium text-foreground">{mood.label}</span>
                  </motion.button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mood-note">Add a note (optional)</Label>
                <Textarea
                  id="mood-note"
                  placeholder="What's on your mind?..."
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Activities today (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITIES.map((activity) => (
                    <Badge
                      key={activity}
                      variant={selectedActivities.includes(activity) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/80"
                      onClick={() => toggleActivity(activity)}
                    >
                      {activity}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleLogMood}
                disabled={!selectedMood}
                className="w-full"
                size="lg"
              >
                {selectedMood ? `Log "${selectedMood.label}" Mood` : 'Select your mood first'}
              </Button>
            </CardContent>
          </Card>

          {/* Mood History Chart */}
          {chartData.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Mood History</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis reversed domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tickFormatter={(v) => ['', '😢', '😔', '😐', '🙂', '😄'][v]} className="text-xs" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const moodIndex = payload[0].value as number;
                          return (
                            <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                              <p className="text-sm">{payload[0].payload.date}</p>
                              <p className="text-lg">{['', '😢', '😔', '😐', '🙂', '😄'][moodIndex]}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="mood" stroke="hsl(15, 90%, 65%)" fill="hsl(15, 90%, 65%)" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Recent Mood Entries */}
          {moodEntries.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recent Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3 pr-4">
                    {moodEntries.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{entry.emoji}</span>
                            <div>
                              <p className="font-medium text-foreground">
                                {MOOD_OPTIONS.find(m => m.value === entry.mood)?.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(entry.created_at).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        {entry.note && (
                          <p className="text-sm text-muted-foreground mt-2">{entry.note}</p>
                        )}
                        {entry.activities && entry.activities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.activities.map((activity: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {activity}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Journal Tab */}
        <TabsContent value="journal" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">Your Journal</h3>
            <Button onClick={() => setJournalDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Entry
            </Button>
          </div>

          {journalEntries.length === 0 ? (
            <Card className="glass-card p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Start journaling</h3>
              <p className="text-muted-foreground mb-4">Write down your thoughts and reflections</p>
              <Button onClick={() => setJournalDialogOpen(true)}>Create First Entry</Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {journalEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  whileHover={{ y: -2 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-lg mb-1">{entry.title || 'Untitled'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditJournal(entry)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteJournal(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-foreground mb-3 whitespace-pre-wrap line-clamp-3">{entry.content}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {entry.mood_before && (
                        <Badge variant="outline" className="text-xs">
                          Before: {entry.mood_before}
                        </Badge>
                      )}
                      {entry.mood_after && (
                        <Badge variant="outline" className="text-xs">
                          After: {entry.mood_after}
                        </Badge>
                      )}
                    </div>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Relax & Music Tab */}
        <TabsContent value="relax" className="space-y-6">
          {/* <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Study Music
              </CardTitle>
              <CardDescription>Lo-fi beats to help you focus and relax</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={YOUTUBE_PLAYLIST}
                  title="Lo-fi Study Music"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </CardContent>
          </Card> */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Breathing Exercise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Try this simple breathing exercise to reduce stress and anxiety.
                </p>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm font-medium text-primary mb-1">Box Breathing</p>
                    <p className="text-xs text-muted-foreground">
                      Inhale for 4 seconds • Hold for 4 • Exhale for 4 • Hold for 4
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                    <p className="text-sm font-medium text-secondary mb-1">4-7-8 Breathing</p>
                    <p className="text-xs text-muted-foreground">
                      Inhale for 4 • Hold for 7 • Exhale for 8
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Wellness Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">✓</span>
                    <span className="text-muted-foreground">Take regular breaks while studying</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">✓</span>
                    <span className="text-muted-foreground">Stay hydrated and eat balanced meals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">✓</span>
                    <span className="text-muted-foreground">Get at least 7-8 hours of sleep</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">✓</span>
                    <span className="text-muted-foreground">Exercise regularly, even if just a walk</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">✓</span>
                    <span className="text-muted-foreground">Connect with friends and family</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Journal Dialog */}
      <Dialog open={journalDialogOpen} onOpenChange={setJournalDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingJournal ? 'Edit' : 'Create'} Journal Entry</DialogTitle>
            <DialogDescription>
              {editingJournal ? 'Update your journal entry' : 'Write down your thoughts and feelings'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="journal-title">Title</Label>
              <Input
                id="journal-title"
                value={journalForm.title}
                onChange={(e) => setJournalForm({ ...journalForm, title: e.target.value })}
                placeholder="Give your entry a title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="journal-content">Content *</Label>
              <Textarea
                id="journal-content"
                value={journalForm.content}
                onChange={(e) => setJournalForm({ ...journalForm, content: e.target.value })}
                placeholder="What's on your mind? How are you feeling?"
                rows={8}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mood-before">Mood Before</Label>
                <Select
                  value={journalForm.mood_before}
                  onValueChange={(value) => setJournalForm({ ...journalForm, mood_before: value })}
                >
                  <SelectTrigger id="mood-before">
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOOD_OPTIONS.map(mood => (
                      <SelectItem key={mood.value} value={mood.emoji}>
                        {mood.emoji} {mood.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mood-after">Mood After</Label>
                <Select
                  value={journalForm.mood_after}
                  onValueChange={(value) => setJournalForm({ ...journalForm, mood_after: value })}
                >
                  <SelectTrigger id="mood-after">
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOOD_OPTIONS.map(mood => (
                      <SelectItem key={mood.value} value={mood.emoji}>
                        {mood.emoji} {mood.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="journal-tags">Tags (comma separated)</Label>
              <Input
                id="journal-tags"
                value={journalForm.tags.join(', ')}
                onChange={(e) => setJournalForm({
                  ...journalForm,
                  tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                })}
                placeholder="gratitude, reflection, goals..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setJournalDialogOpen(false);
              setEditingJournal(null);
              resetJournalForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingJournal ? handleUpdateJournal : handleCreateJournal}>
              {editingJournal ? 'Update' : 'Save'} Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentalHealth;
