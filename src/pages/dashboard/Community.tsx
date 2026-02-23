import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Users,
  MessageSquare,
  Heart,
  Send,
  Plus,
  Search,
  Pin,
  Flag,
  Trash2,
  Edit2,
  EyeOff,
  Megaphone,
  Search as SearchIcon,
  Calendar,
  MapPin,
  AlertCircle,
} from "lucide-react";

const POST_TYPES = [
  { value: 'general', label: 'General', icon: MessageSquare, color: 'bg-primary/10 text-primary' },
  { value: 'announcement', label: 'Announcement', icon: Megaphone, color: 'bg-secondary/10 text-secondary' },
  { value: 'lost_found', label: 'Lost & Found', icon: Search, color: 'bg-warning/10 text-warning' },
  { value: 'club', label: 'Club', icon: Users, color: 'bg-accent/10 text-accent' },
  { value: 'confession', label: 'Confession', icon: EyeOff, color: 'bg-muted text-muted-foreground' },
  { value: 'event', label: 'Event', icon: Calendar, color: 'bg-success/10 text-success' },
];

const Community = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<Map<string, any>>(new Map());

  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    post_type: 'general',
    is_anonymous: false,
  });

  const [commentForm, setCommentForm] = useState('');
  const [commentAnonymous, setCommentAnonymous] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchProfiles();
      subscribeToPosts();
      subscribeToComments();
      subscribeToLikes();
    }
  }, [user, activeTab]);

  const fetchProfiles = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*');

      if (data) {
        const profileMap = new Map(data.map(p => [p.user_id, p]));
        setUserProfiles(profileMap);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const subscribeToPosts = () => {
    const subscription = supabase
      .channel('posts-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const subscribeToComments = () => {
    const subscription = supabase
      .channel('comments-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        fetchPosts();
        if (selectedPost) fetchComments(selectedPost.id);
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const subscribeToLikes = () => {
    const subscription = supabase
      .channel('likes-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('posts')
        .select('*');

      if (activeTab !== 'all') {
        query = query.eq('post_type', activeTab);
      }

      const { data, error } = await query
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch additional data for each post
      const postsWithData = await Promise.all(
        (data || []).map(async (post) => {
          // Fetch likes count and user liked status
          const { data: likesData } = await supabase
            .from('likes')
            .select('*')
            .eq('post_id', post.id);

          const userLiked = likesData?.some(l => l.user_id === user?.id) || false;

          // Fetch comments count
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          return {
            ...post,
            likes: likesData?.length || 0,
            userLiked,
            comments_count: count || 0,
          };
        })
      );

      setPosts(postsWithData);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!postForm.content.trim()) {
      toast({ title: 'Error', description: 'Post content is required', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user?.id,
        title: postForm.title,
        content: postForm.content,
        post_type: postForm.post_type,
        is_anonymous: postForm.is_anonymous,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Post created successfully' });
      setPostDialogOpen(false);
      resetPostForm();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;

      toast({ title: 'Success', description: 'Post deleted' });
      fetchPosts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', user?.id)
        .eq('post_id', postId)
        .maybeSingle();

      if (existingLike) {
        await supabase.from('likes').delete().eq('id', existingLike.id);
      } else {
        await supabase.from('likes').insert({
          user_id: user?.id,
          post_id: postId,
        });
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
    }
  };

  const handleCreateComment = async () => {
    if (!commentForm.trim() || !selectedPost) return;

    try {
      const { error } = await supabase.from('comments').insert({
        post_id: selectedPost.id,
        user_id: user?.id,
        content: commentForm,
        is_anonymous: commentAnonymous,
      });

      if (error) throw error;

      setCommentForm('');
      setCommentAnonymous(false);
      fetchComments(selectedPost.id);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;

      toast({ title: 'Success', description: 'Comment deleted' });
      fetchComments(selectedPost.id);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleReportPost = async (postId: string) => {
    const reason = prompt('Why are you reporting this post?');
    if (!reason) return;

    try {
      const { error } = await supabase.from('reports').insert({
        user_id: user?.id,
        post_id: postId,
        reason,
      });

      if (error) throw error;

      toast({ title: 'Reported', description: 'Thank you for your report' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const openPostDetail = (post: any) => {
    setSelectedPost(post);
    fetchComments(post.id);
  };

  const resetPostForm = () => {
    setPostForm({
      title: '',
      content: '',
      post_type: 'general',
      is_anonymous: false,
    });
  };

  const getProfile = (userId: string) => {
    return userProfiles.get(userId);
  };

  const filteredPosts = posts.filter(post =>
    post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPostTypeStyle = (type: string) => {
    const postType = POST_TYPES.find(t => t.value === type);
    return postType?.color || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Community</h2>
          <p className="text-muted-foreground">Connect with your school community</p>
        </div>
        <Button onClick={() => setPostDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Post
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Post Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all">All</TabsTrigger>
            {POST_TYPES.map(type => (
              <TabsTrigger key={type.value} value={type.value}>
                <type.icon className="h-4 w-4 mr-1" />
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent"
              />
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card className="glass-card p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">Be the first to share something with your community!</p>
              <Button onClick={() => setPostDialogOpen(true)}>Create Post</Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredPosts.map((post) => {
                const postType = POST_TYPES.find(t => t.value === post.post_type);
                const PostIcon = postType?.icon || MessageSquare;
                const profile = getProfile(post.user_id);
                const isLiked = post.userLiked;

                return (
                  <motion.div
                    key={post.id}
                    whileHover={{ y: -2 }}
                    className="glass-card p-5 cursor-pointer"
                    onClick={() => openPostDetail(post)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={post.is_anonymous ? 'bg-muted' : 'gradient-bg-primary'}>
                            {post.is_anonymous ? '?' : (profile?.full_name?.charAt(0) || user?.email?.charAt(0) || '?')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {post.is_anonymous ? 'Anonymous' : (profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {post.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                        <Badge className={getPostTypeStyle(post.post_type)}>
                          <PostIcon className="h-3 w-3 mr-1" />
                          {postType?.label || post.post_type}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    {post.title && (
                      <h3 className="font-semibold text-foreground mb-2">{post.title}</h3>
                    )}
                    <p className="text-muted-foreground mb-3 line-clamp-3">{post.content}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 text-sm">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLike(post.id);
                        }}
                        className={`flex items-center gap-1.5 ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'} transition-colors`}
                      >
                        <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span>{post.likes || 0}</span>
                      </motion.button>

                      <button className="flex items-center gap-1.5 text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.comments_count || 0}</span>
                      </button>

                      {post.user_id === user?.id && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(post.id);
                          }}
                          className="ml-auto text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      )}

                      {post.user_id !== user?.id && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReportPost(post.id);
                          }}
                          className="ml-auto text-muted-foreground hover:text-warning"
                        >
                          <Flag className="h-4 w-4" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          {selectedPost && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={selectedPost.is_anonymous ? 'bg-muted' : 'gradient-bg-primary'}>
                      {selectedPost.is_anonymous ? '?' : (getProfile(selectedPost.user_id)?.full_name?.charAt(0) || '?')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedPost.is_anonymous ? 'Anonymous' : (getProfile(selectedPost.user_id)?.full_name || 'Student')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedPost.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                {selectedPost.title && (
                  <DialogTitle>{selectedPost.title}</DialogTitle>
                )}
              </DialogHeader>

              <ScrollArea className="flex-1 px-6">
                <p className="text-foreground whitespace-pre-wrap mb-6">{selectedPost.content}</p>

                {/* Comments Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Comments ({comments.length})</h3>

                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment) => {
                        const commentProfile = getProfile(comment.user_id);
                        return (
                          <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-lg bg-muted/30"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {comment.is_anonymous ? '?' : (commentProfile?.full_name?.charAt(0) || '?')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-foreground">
                                  {comment.is_anonymous ? 'Anonymous' : commentProfile?.full_name}
                                </span>
                              </div>
                              {comment.user_id === user?.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{comment.content}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Comment Input */}
              <div className="p-6 border-t border-border">
                <div className="flex items-start gap-2">
                  <Textarea
                    value={commentForm}
                    onChange={(e) => setCommentForm(e.target.value)}
                    placeholder="Write a comment..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleCreateComment}
                    disabled={!commentForm.trim()}
                    size="icon"
                    className="mt-auto"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <label className="flex items-center gap-2 mt-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={commentAnonymous}
                    onChange={(e) => setCommentAnonymous(e.target.checked)}
                    className="rounded"
                  />
                  Post anonymously
                </label>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Post Dialog */}
      <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
            <DialogDescription>Share something with your school community</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="post-type">Post Type</Label>
              <Select
                value={postForm.post_type}
                onValueChange={(value) => setPostForm({ ...postForm, post_type: value })}
              >
                <SelectTrigger id="post-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POST_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-title">Title (optional)</Label>
              <Input
                id="post-title"
                value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                placeholder="Give your post a title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-content">Content *</Label>
              <Textarea
                id="post-content"
                value={postForm.content}
                onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                placeholder="What's on your mind?"
                rows={5}
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={postForm.is_anonymous}
                onChange={(e) => setPostForm({ ...postForm, is_anonymous: e.target.checked })}
                className="rounded"
              />
              Post anonymously
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPostDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePost}>Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Community;
