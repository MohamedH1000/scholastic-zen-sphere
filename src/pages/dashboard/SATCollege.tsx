import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  GraduationCap,
  Brain,
  Calculator,
  TrendingUp,
  BookOpen,
  Target,
  Award,
  Plus,
  Search,
  Filter,
  MapPin,
  Heart,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0,
};

const SATCollege = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('quizzes');
  const [courses, setCourses] = useState<any[]>([]);
  const [gpaHistory, setGpaHistory] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [savedColleges, setSavedColleges] = useState<any[]>([]);
  const [quizCategories, setQuizCategories] = useState<any[]>([]);
  const [quizResults, setQuizResults] = useState<any[]>([]);

  // Quiz states
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizTime, setQuizTime] = useState(0);
  const [quizActive, setQuizActive] = useState(false);

  // Dialog states
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [collegeDialogOpen, setCollegeDialogOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<any>(null);

  // Form states
  const [courseForm, setCourseForm] = useState({
    name: '',
    grade: '',
    credit_hours: 1.0,
    semester: 'Fall',
    year: new Date().getFullYear(),
  });

  const [collegeFilter, setCollegeFilter] = useState({
    search: '',
    state: '',
    min_gpa: '',
  });

  useEffect(() => {
    if (user) {
      fetchCourses();
      fetchColleges();
      fetchQuizCategories();
      fetchQuizResults();
      fetchSavedColleges();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);

      // Calculate GPA
      if (data && data.length > 0) {
        const totalPoints = data.reduce((sum, course) => sum + (GRADE_POINTS[course.grade] || 0) * course.credit_hours, 0);
        const totalCredits = data.reduce((sum, course) => sum + course.credit_hours, 0);
        const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
        await saveGPAHistory(gpa);
      }
    } catch (error: any) {
      console.error('Error fetching courses:', error);
    }
  };

  const saveGPAHistory = async (gpa: number) => {
    try {
      const { data: existingHistory } = await supabase
        .from('gpa_history')
        .select('*')
        .eq('user_id', user?.id)
        .eq('semester', courseForm.semester)
        .eq('year', courseForm.year)
        .single();

      if (!existingHistory) {
        await supabase.from('gpa_history').insert({
          user_id: user?.id,
          gpa,
          cumulative_gpa: gpa,
          semester: courseForm.semester,
          year: courseForm.year,
        });
      }

      const { data } = await supabase
        .from('gpa_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('calculated_at', { ascending: true });

      setGpaHistory(data || []);
    } catch (error) {
      console.error('Error saving GPA:', error);
    }
  };

  const fetchColleges = async () => {
    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('*')
        .order('name');

      if (error) throw error;
      setColleges(data || []);
    } catch (error: any) {
      console.error('Error fetching colleges:', error);
    }
  };

  const fetchSavedColleges = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_colleges')
        .select('*, colleges(*)')
        .eq('user_id', user?.id);

      if (error) throw error;
      setSavedColleges(data || []);
    } catch (error: any) {
      console.error('Error fetching saved colleges:', error);
    }
  };

  const fetchQuizCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_categories')
        .select('*');

      if (error) throw error;
      setQuizCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching quiz categories:', error);
    }
  };

  const fetchQuizResults = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*, quiz_categories(*)')
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setQuizResults(data || []);
    } catch (error: any) {
      console.error('Error fetching quiz results:', error);
    }
  };

  const startQuiz = async (categoryId: string) => {
    try {
      const { data: questions, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('category_id', categoryId)
        .limit(10);

      if (error) throw error;

      if (questions && questions.length > 0) {
        setActiveQuiz({
          category: quizCategories.find(c => c.id === categoryId),
          questions,
        });
        setCurrentQuestion(0);
        setQuizAnswers([]);
        setQuizTime(0);
        setQuizActive(true);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleQuizAnswer = (answerIndex: number) => {
    const newAnswers = [...quizAnswers, answerIndex];
    setQuizAnswers(newAnswers);

    if (currentQuestion < activeQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz(newAnswers);
    }
  };

  const finishQuiz = async (answers: number[]) => {
    try {
      let correct = 0;
      activeQuiz.questions.forEach((q: any, index: number) => {
        if (answers[index] === q.correct_answer) correct++;
      });

      const score = correct;
      const total = activeQuiz.questions.length;

      await supabase.from('quiz_results').insert({
        user_id: user?.id,
        category_id: activeQuiz.category.id,
        score,
        total_questions: total,
        answers,
        time_taken: quizTime,
      });

      const percentage = Math.round((score / total) * 100);
      toast({
        title: 'Quiz Complete!',
        description: `You scored ${score}/${total} (${percentage}%)`,
      });

      setQuizActive(false);
      setActiveQuiz(null);
      fetchQuizResults();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleCreateCourse = async () => {
    try {
      const { error } = await supabase.from('courses').insert({
        user_id: user?.id,
        name: courseForm.name,
        grade: courseForm.grade,
        credit_hours: courseForm.credit_hours,
        semester: courseForm.semester,
        year: courseForm.year,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Course added successfully' });
      setCourseDialogOpen(false);
      resetCourseForm();
      fetchCourses();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;

      toast({ title: 'Success', description: 'Course deleted' });
      fetchCourses();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleSaveCollege = async (collegeId: string) => {
    try {
      const { error } = await supabase.from('saved_colleges').insert({
        user_id: user?.id,
        college_id: collegeId,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'College saved to your list' });
      fetchSavedColleges();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleRemoveCollege = async (savedId: string) => {
    try {
      const { error } = await supabase.from('saved_colleges').delete().eq('id', savedId);
      if (error) throw error;

      toast({ title: 'Success', description: 'College removed' });
      fetchSavedColleges();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const resetCourseForm = () => {
    setCourseForm({
      name: '',
      grade: '',
      credit_hours: 1.0,
      semester: 'Fall',
      year: new Date().getFullYear(),
    });
  };

  const calculateGPA = () => {
    if (courses.length === 0) return 0;
    const totalPoints = courses.reduce((sum, course) => sum + (GRADE_POINTS[course.grade] || 0) * course.credit_hours, 0);
    const totalCredits = courses.reduce((sum, course) => sum + course.credit_hours, 0);
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  const filteredColleges = colleges.filter(college => {
    if (collegeFilter.search && !college.name.toLowerCase().includes(collegeFilter.search.toLowerCase())) return false;
    if (collegeFilter.state && college.state !== collegeFilter.state) return false;
    if (collegeFilter.min_gpa && college.gpa_requirement && college.gpa_requirement < parseFloat(collegeFilter.min_gpa)) return false;
    return true;
  });

  const currentGPA = parseFloat(calculateGPA());

  if (quizActive && activeQuiz) {
    const question = activeQuiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / activeQuiz.questions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto">
        <Card className="glass-card-elevated">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {activeQuiz.category?.name}
              </CardTitle>
              <Badge variant="outline">{currentQuestion + 1}/{activeQuiz.questions.length}</Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">{question.question}</h3>
              <div className="space-y-3">
                {question.options.map((option: string, index: number) => (
                  <motion.button
                    key={index}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuizAnswer(index)}
                    className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">SAT & College Prep</h2>
        <p className="text-muted-foreground">Practice quizzes, track GPA, and explore colleges</p>
      </div>

      {/* GPA Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="font-display text-4xl font-bold text-foreground">{calculateGPA()}</span>
              <span className="text-sm text-muted-foreground mb-1">/ 4.0</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="font-display text-4xl font-bold text-foreground">{courses.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quiz Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="font-display text-4xl font-bold text-foreground">
                {quizResults.length > 0
                  ? Math.round(quizResults.reduce((sum, r) => sum + (r.score / r.total_questions) * 100, 0) / quizResults.length)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quizzes">SAT Quizzes</TabsTrigger>
          <TabsTrigger value="gpa">GPA Calculator</TabsTrigger>
          <TabsTrigger value="colleges">College Explorer</TabsTrigger>
        </TabsList>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quizCategories.map((category) => (
              <motion.div
                key={category.id}
                whileHover={{ y: -4 }}
                className="glass-card p-6 cursor-pointer"
                onClick={() => startQuiz(category.id)}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <Calculator className="h-6 w-6" style={{ color: category.color }} />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{category.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                <Button className="w-full" size="sm">
                  Start Quiz
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Recent Results */}
          {quizResults.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recent Quiz Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3 pr-4">
                    {quizResults.map((result) => {
                      const percentage = Math.round((result.score / result.total_questions) * 100);
                      return (
                        <div key={result.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Brain className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{result.quiz_categories?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(result.completed_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">{result.score}/{result.total_questions}</p>
                            <p className="text-xs text-muted-foreground">{percentage}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* GPA Calculator Tab */}
        <TabsContent value="gpa" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">Your Courses</h3>
            <Button onClick={() => setCourseDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Course
            </Button>
          </div>

          {courses.length === 0 ? (
            <Card className="glass-card p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No courses added yet</h3>
              <p className="text-muted-foreground mb-4">Add your courses to calculate your GPA</p>
              <Button onClick={() => setCourseDialogOpen(true)}>Add Your First Course</Button>
            </Card>
          ) : (
            <div className="grid gap-3">
              {courses.map((course) => (
                <motion.div
                  key={course.id}
                  whileHover={{ x: 4 }}
                  className="glass-card p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{course.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {course.semester} {course.year} • {course.credit_hours} credit hours
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className="text-lg font-bold px-3 py-1">{course.grade}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteCourse(course.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* GPA History Chart */}
          {gpaHistory.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>GPA History</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={gpaHistory.map(h => ({ ...h, calculated_at: new Date(h.calculated_at).toLocaleDateString() }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="calculated_at" className="text-xs" />
                    <YAxis domain={[0, 4]} className="text-xs" />
                    <Tooltip />
                    <Line type="monotone" dataKey="cumulative_gpa" stroke="hsl(15, 90%, 65%)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* College Explorer Tab */}
        <TabsContent value="colleges" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search colleges..."
                value={collegeFilter.search}
                onChange={(e) => setCollegeFilter({ ...collegeFilter, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Input
              placeholder="Min GPA"
              type="number"
              step="0.1"
              min="0"
              max="4.0"
              value={collegeFilter.min_gpa}
              onChange={(e) => setCollegeFilter({ ...collegeFilter, min_gpa: e.target.value })}
              className="sm:w-32"
            />
          </div>

          <Tabs defaultValue="explore" className="w-full">
            <TabsList>
              <TabsTrigger value="explore">Explore</TabsTrigger>
              <TabsTrigger value="saved">
                Saved ({savedColleges.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="explore" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredColleges.map((college) => (
                  <motion.div
                    key={college.id}
                    whileHover={{ y: -4 }}
                    className="glass-card p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg">{college.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {college.location}, {college.state}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSaveCollege(college.id)}
                        className={savedColleges.some(sc => sc.college_id === college.id) ? 'text-primary' : ''}
                      >
                        <Heart className={`h-5 w-5 ${savedColleges.some(sc => sc.college_id === college.id) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>

                    <div className="flex gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">GPA: </span>
                        <span className="font-medium">{college.gpa_requirement || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">SAT: </span>
                        <span className="font-medium">{college.sat_requirement || 'N/A'}</span>
                      </div>
                    </div>

                    {college.majors && college.majors.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {college.majors.slice(0, 3).map((major: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {major}
                          </Badge>
                        ))}
                        {college.majors.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{college.majors.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {currentGPA >= (college.gpa_requirement || 0) && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        You meet the GPA requirement
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="saved" className="space-y-4">
              {savedColleges.length === 0 ? (
                <Card className="glass-card p-12 text-center">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No saved colleges</h3>
                  <p className="text-muted-foreground">Save colleges to build your list</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedColleges.map((saved) => (
                    <motion.div
                      key={saved.id}
                      whileHover={{ y: -4 }}
                      className="glass-card p-5 relative"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-destructive"
                        onClick={() => handleRemoveCollege(saved.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <h3 className="font-semibold text-foreground text-lg pr-8">
                        {saved.colleges?.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {saved.colleges?.location}, {saved.colleges?.state}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Course Dialog */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Course</DialogTitle>
            <DialogDescription>Add a course to calculate your GPA</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="course_name">Course Name *</Label>
              <Input
                id="course_name"
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                placeholder="e.g., AP Calculus BC"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade *</Label>
                <Select
                  value={courseForm.grade}
                  onValueChange={(value) => setCourseForm({ ...courseForm, grade: value })}
                >
                  <SelectTrigger id="grade">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(GRADE_POINTS).map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade} ({GRADE_POINTS[grade]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credits">Credit Hours</Label>
                <Input
                  id="credits"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="10"
                  value={courseForm.credit_hours}
                  onChange={(e) => setCourseForm({ ...courseForm, credit_hours: parseFloat(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={courseForm.semester}
                  onValueChange={(value) => setCourseForm({ ...courseForm, semester: value })}
                >
                  <SelectTrigger id="semester">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fall">Fall</SelectItem>
                    <SelectItem value="Spring">Spring</SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                    <SelectItem value="Winter">Winter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={courseForm.year}
                  onChange={(e) => setCourseForm({ ...courseForm, year: parseInt(e.target.value) || new Date().getFullYear() })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCourse}>Add Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SATCollege;
