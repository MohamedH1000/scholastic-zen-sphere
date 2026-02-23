-- ============================================
-- STUDY ORGANIZER MODULE
-- ============================================

-- Subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'hsl(225, 60%, 55%)',
  teacher_name TEXT,
  room_number TEXT,
  schedule TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subjects" ON public.subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subjects" ON public.subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subjects" ON public.subjects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subjects" ON public.subjects FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SAT & COLLEGE MODULE
-- ============================================

-- Quiz categories
CREATE TABLE public.quiz_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT NOT NULL DEFAULT 'hsl(225, 60%, 55%)',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quiz questions
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.quiz_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view quiz questions" ON public.quiz_questions FOR SELECT USING (true);

-- Quiz results
CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.quiz_categories(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL,
  time_taken INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own quiz results" ON public.quiz_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quiz results" ON public.quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Courses for GPA
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F')),
  credit_hours NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
  semester TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own courses" ON public.courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own courses" ON public.courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own courses" ON public.courses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own courses" ON public.courses FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- GPA history
CREATE TABLE public.gpa_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gpa NUMERIC(3, 2) NOT NULL,
  cumulative_gpa NUMERIC(3, 2) NOT NULL,
  semester TEXT NOT NULL,
  year INTEGER NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gpa_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own GPA history" ON public.gpa_history FOR SELECT USING (auth.uid() = user_id);

-- Colleges
CREATE TABLE public.colleges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'USA',
  gpa_requirement NUMERIC(3, 2),
  sat_requirement INTEGER,
  majors TEXT[],
  description TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view colleges" ON public.colleges FOR SELECT USING (true);

-- Saved colleges
CREATE TABLE public.saved_colleges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, college_id)
);

ALTER TABLE public.saved_colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own saved colleges" ON public.saved_colleges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own saved colleges" ON public.saved_colleges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved colleges" ON public.saved_colleges FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- MENTAL HEALTH MODULE
-- ============================================

-- Mood entries
CREATE TABLE public.mood_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('amazing', 'good', 'okay', 'bad', 'terrible')),
  emoji TEXT NOT NULL,
  note TEXT,
  activities TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own mood entries" ON public.mood_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mood entries" ON public.mood_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mood entries" ON public.mood_entries FOR DELETE USING (auth.uid() = user_id);

-- Journal entries
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  tags TEXT[],
  is_encrypted BOOLEAN NOT NULL DEFAULT true,
  mood_before TEXT,
  mood_after TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own journal entries" ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own journal entries" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own journal entries" ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own journal entries" ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Motivational quotes
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  author TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view quotes" ON public.quotes FOR SELECT USING (true);

-- ============================================
-- COMMUNITY MODULE
-- ============================================

-- Posts
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'general' CHECK (post_type IN ('general', 'announcement', 'lost_found', 'club', 'confession', 'event')),
  images TEXT[],
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any post" ON public.posts FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
);

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any comment" ON public.comments FOR DELETE USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
);

-- Likes
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Reports
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all reports" ON public.reports FOR SELECT USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Tasks indexes
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_subject_id ON public.tasks(subject_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- Quiz indexes
CREATE INDEX idx_quiz_questions_category ON public.quiz_questions(category_id);
CREATE INDEX idx_quiz_results_user ON public.quiz_results(user_id);
CREATE INDEX idx_quiz_results_category ON public.quiz_results(category_id);

-- College indexes
CREATE INDEX idx_saved_colleges_user ON public.saved_colleges(user_id);

-- Mood indexes
CREATE INDEX idx_mood_entries_user ON public.mood_entries(user_id);
CREATE INDEX idx_mood_entries_created ON public.mood_entries(created_at DESC);

-- Journal indexes
CREATE INDEX idx_journal_entries_user ON public.journal_entries(user_id);
CREATE INDEX idx_journal_entries_created ON public.journal_entries(created_at DESC);

-- Community indexes
CREATE INDEX idx_posts_user ON public.posts(user_id);
CREATE INDEX idx_posts_type ON public.posts(post_type);
CREATE INDEX idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX idx_comments_post ON public.comments(post_id);
CREATE INDEX idx_likes_post ON public.likes(post_id);
CREATE INDEX idx_reports_status ON public.reports(status);

-- ============================================
-- INSERT INITIAL DATA
-- ============================================

-- Quiz categories
INSERT INTO public.quiz_categories (name, description, icon, color) VALUES
('Math', 'Mathematics questions including algebra, geometry, and data analysis', 'Calculator', 'hsl(15, 90%, 65%)'),
('Reading', 'Reading comprehension and vocabulary questions', 'BookOpen', 'hsl(225, 60%, 55%)'),
('Writing', 'Grammar and writing structure questions', 'PenTool', 'hsl(260, 60%, 60%)');

-- Sample quiz questions
INSERT INTO public.quiz_questions (category_id, question, options, correct_answer, explanation, difficulty)
SELECT
  c.id,
  'If x + 5 = 12, what is the value of x?',
  '["5", "7", "12", "17"]'::jsonb,
  1,
  'Subtract 5 from both sides: x = 12 - 5 = 7',
  'easy'
FROM public.quiz_categories c WHERE c.name = 'Math'
LIMIT 1;

INSERT INTO public.quiz_questions (category_id, question, options, correct_answer, explanation, difficulty)
SELECT
  c.id,
  'What is the main idea of this passage?',
  '["The author loves summer", "Summer is the best season for outdoor activities", "Weather affects our mood", "None of the above"]'::jsonb,
  1,
  'The passage focuses on outdoor activities during summer.',
  'medium'
FROM public.quiz_categories c WHERE c.name = 'Reading'
LIMIT 1;

-- Sample colleges
INSERT INTO public.colleges (name, location, state, gpa_requirement, sat_requirement, majors, description, website) VALUES
('Harvard University', 'Cambridge', 'MA', 3.9, 1500, ARRAY['Computer Science', 'Economics', 'Political Science'], 'A prestigious Ivy League university known for its academic excellence.', 'https://www.harvard.edu'),
('MIT', 'Cambridge', 'MA', 3.9, 1500, ARRAY['Engineering', 'Computer Science', 'Physics'], 'Leading institution in science, technology, and engineering.', 'https://www.mit.edu'),
('Stanford University', 'Stanford', 'CA', 3.9, 1450, ARRAY['Computer Science', 'Business', 'Biology'], 'Located in the heart of Silicon Valley, known for innovation and entrepreneurship.', 'https://www.stanford.edu'),
('UCLA', 'Los Angeles', 'CA', 3.5, 1300, ARRAY['Psychology', 'Business', 'Biology'], 'A top public university with diverse programs and vibrant campus life.', 'https://www.ucla.edu'),
('University of Michigan', 'Ann Arbor', 'MI', 3.5, 1350, ARRAY['Engineering', 'Business', 'Computer Science'], 'A renowned public university with strong academics and school spirit.', 'https://www.umich.edu');

-- Sample quotes
INSERT INTO public.quotes (text, author, category) VALUES
('The only way to do great work is to love what you do.', 'Steve Jobs', 'motivation'),
('Education is the most powerful weapon which you can use to change the world.', 'Nelson Mandela', 'education'),
('Believe you can and you''re halfway there.', 'Theodore Roosevelt', 'motivation'),
('The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt', 'dreams'),
('Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill', 'success');
