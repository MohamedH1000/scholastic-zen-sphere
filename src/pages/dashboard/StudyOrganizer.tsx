import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Plus,
  Filter,
  CheckCircle2,
  Circle,
  AlertCircle,
  Edit2,
  Trash2,
  Search,
  SortAsc,
  BookMarked,
  Palette,
} from "lucide-react";

const SUBJECT_COLORS = [
  { name: 'Blue', value: 'hsl(225, 60%, 55%)' },
  { name: 'Purple', value: 'hsl(260, 60%, 60%)' },
  { name: 'Pink', value: 'hsl(340, 80%, 60%)' },
  { name: 'Orange', value: 'hsl(25, 95%, 65%)' },
  { name: 'Green', value: 'hsl(152, 60%, 45%)' },
  { name: 'Red', value: 'hsl(0, 72%, 51%)' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const StudyOrganizer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'created_at'>('due_date');

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    subject_id: '',
    due_date: '',
    priority: 'medium',
    status: 'pending',
  });

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    color: SUBJECT_COLORS[0].value,
    teacher_name: '',
    room_number: '',
    schedule: '',
  });

  useEffect(() => {
    if (user) {
      fetchSubjects();
      fetchTasks();
    }
  }, [user]);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('tasks')
        .select('*, subjects(*)')
        .eq('user_id', user?.id);

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query.order(sortBy, { ascending: sortBy === 'due_date' });

      if (error) throw error;

      let filteredTasks = data || [];

      // Apply overdue check
      filteredTasks = filteredTasks.map(task => {
        if (task.status !== 'completed' && task.due_date && new Date(task.due_date) < new Date()) {
          return { ...task, status: 'overdue' };
        }
        return task;
      });

      // Apply search filter
      if (searchQuery) {
        filteredTasks = filteredTasks.filter(task =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setTasks(filteredTasks);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filterStatus, sortBy, searchQuery]);

  const handleCreateTask = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user?.id,
          title: taskForm.title,
          description: taskForm.description,
          subject_id: taskForm.subject_id || null,
          due_date: taskForm.due_date || null,
          priority: taskForm.priority,
          status: taskForm.status,
        });

      if (error) throw error;

      toast({ title: 'Success', description: 'Task created successfully' });
      setTaskDialogOpen(false);
      resetTaskForm();
      fetchTasks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdateTask = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: taskForm.title,
          description: taskForm.description,
          subject_id: taskForm.subject_id || null,
          due_date: taskForm.due_date || null,
          priority: taskForm.priority,
          status: taskForm.status,
          completed_at: taskForm.status === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', editingTask.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Task updated successfully' });
      setTaskDialogOpen(false);
      setEditingTask(null);
      resetTaskForm();
      fetchTasks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Task deleted successfully' });
      fetchTasks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleTaskStatus = async (task: any) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', task.id);

      if (error) throw error;
      fetchTasks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleCreateSubject = async () => {
    try {
      const { error } = await supabase
        .from('subjects')
        .insert({
          user_id: user?.id,
          name: subjectForm.name,
          color: subjectForm.color,
          teacher_name: subjectForm.teacher_name,
          room_number: subjectForm.room_number,
          schedule: subjectForm.schedule,
        });

      if (error) throw error;

      toast({ title: 'Success', description: 'Subject created successfully' });
      setSubjectDialogOpen(false);
      resetSubjectForm();
      fetchSubjects();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Subject deleted successfully' });
      fetchSubjects();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const openEditDialog = (task: any) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      subject_id: task.subject_id || '',
      due_date: task.due_date || '',
      priority: task.priority,
      status: task.status,
    });
    setTaskDialogOpen(true);
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      subject_id: '',
      due_date: '',
      priority: 'medium',
      status: 'pending',
    });
  };

  const resetSubjectForm = () => {
    setSubjectForm({
      name: '',
      color: SUBJECT_COLORS[0].value,
      teacher_name: '',
      room_number: '',
      schedule: '',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'overdue': return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-warning" />;
      default: return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const filteredTasksByStatus = {
    all: tasks,
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
    overdue: tasks.filter(t => t.status === 'overdue'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Study Organizer</h2>
          <p className="text-muted-foreground">Manage your tasks and subjects</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSubjectDialogOpen(true)}
            className="gap-2"
          >
            <BookMarked className="h-4 w-4" />
            Add Subject
          </Button>
          <Button
            onClick={() => {
              resetTaskForm();
              setEditingTask(null);
              setTaskDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Subjects */}
      {subjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <h3 className="font-semibold text-foreground mb-3">Your Subjects</h3>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <Badge
                key={subject.id}
                variant="outline"
                className="px-3 py-1.5 text-sm cursor-pointer hover:bg-muted transition-colors"
                style={{
                  borderColor: subject.color,
                  color: subject.color,
                  backgroundColor: `${subject.color}10`,
                }}
              >
                {subject.name}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SortAsc className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="due_date">Due Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="created_at">Created</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="board">Board View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-3 pr-4">
              {filteredTasksByStatus[filterStatus as keyof typeof filteredTasksByStatus]?.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground">No tasks found. Create your first task!</p>
                </div>
              ) : (
                filteredTasksByStatus[filterStatus as keyof typeof filteredTasksByStatus]?.map((task) => (
                  <motion.div
                    key={task.id}
                    variants={item}
                    whileHover={{ x: 4 }}
                    className="glass-card p-4 group"
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className="mt-1 flex-shrink-0"
                      >
                        {getStatusIcon(task.status)}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className={`font-medium text-foreground ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(task)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          {task.subjects && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: task.subjects.color,
                                color: task.subjects.color,
                              }}
                            >
                              {task.subjects.name}
                            </Badge>
                          )}

                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </Badge>

                          {task.due_date && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="board" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['pending', 'in_progress', 'completed', 'overdue'] as const).map((status) => (
              <div key={status} className="glass-card p-4">
                <h3 className="font-semibold text-foreground mb-3 capitalize flex items-center gap-2">
                  {getStatusIcon(status)}
                  {status.replace('_', ' ')}
                  <Badge variant="secondary" className="ml-auto">
                    {filteredTasksByStatus[status]?.length || 0}
                  </Badge>
                </h3>
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="space-y-2 pr-2">
                    {filteredTasksByStatus[status]?.map((task) => (
                      <motion.div
                        key={task.id}
                        whileHover={{ scale: 1.02 }}
                        className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-border/80 transition-colors"
                        onClick={() => openEditDialog(task)}
                      >
                        <h4 className="font-medium text-foreground text-sm mb-2 line-clamp-2">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {task.subjects && (
                            <span style={{ color: task.subjects.color }}>
                              {task.subjects.name}
                            </span>
                          )}
                          {task.due_date && (
                            <span>• {new Date(task.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Update your task details below.' : 'Add a new task to your study plan.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Add details about this task..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={taskForm.subject_id}
                  onValueChange={(value) => setTaskForm({ ...taskForm, subject_id: value })}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          {subject.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(value: any) => setTaskForm({ ...taskForm, priority: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={taskForm.status}
                  onValueChange={(value: any) => setTaskForm({ ...taskForm, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingTask ? handleUpdateTask : handleCreateTask}>
              {editingTask ? 'Update' : 'Create'} Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subject Dialog */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Subject</DialogTitle>
            <DialogDescription>
              Add a new subject to organize your tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject_name">Subject Name *</Label>
              <Input
                id="subject_name"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                placeholder="e.g., Mathematics, English, Physics"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {SUBJECT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSubjectForm({ ...subjectForm, color: color.value })}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      subjectForm.color === color.value
                        ? 'ring-2 ring-foreground ring-offset-2 scale-110'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teacher">Teacher Name</Label>
                <Input
                  id="teacher"
                  value={subjectForm.teacher_name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, teacher_name: e.target.value })}
                  placeholder="Mr./Ms. Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room">Room Number</Label>
                <Input
                  id="room"
                  value={subjectForm.room_number}
                  onChange={(e) => setSubjectForm({ ...subjectForm, room_number: e.target.value })}
                  placeholder="Room 101"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Input
                id="schedule"
                value={subjectForm.schedule}
                onChange={(e) => setSubjectForm({ ...subjectForm, schedule: e.target.value })}
                placeholder="Mon, Wed, Fri 10:00 AM"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSubjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubject}>
              Create Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudyOrganizer;
