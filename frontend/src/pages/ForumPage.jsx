import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const CATEGORIES = [
    { id: 'all', label: 'All Posts', icon: null },
    { id: 'introduction', label: 'Introductions', color: 'emerald' },
    { id: 'question', label: 'Questions', color: 'violet' },
    { id: 'share', label: 'Sharing', color: 'amber' },
    { id: 'general', label: 'General', color: 'brand' },
];

const CAT_STYLES = {
    introduction: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: '👋', label: 'Introduction' },
    question: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', icon: '?', label: 'Question' },
    share: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: '>', label: 'Share' },
    general: { bg: 'bg-surface-50', text: 'text-surface-600', border: 'border-surface-100', icon: '#', label: 'General' },
};

function timeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 172800) return 'yesterday';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Post Card ───────────────────────────────────────────────────────────
function PostCard({ post, currentUserId, onLike, onDelete, onToggleComments }) {
    const cat = CAT_STYLES[post.category] || CAT_STYLES.general;
    const isAuthor = post.author?._id === currentUserId;

    return (
        <div className="card hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold shrink-0">
                    {(post.author?.name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-surface-800">{post.author?.name || 'Unknown'}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
                            <span className="font-mono">{cat.icon}</span> {cat.label}
                        </span>
                    </div>
                    <p className="text-[10px] text-surface-400 mt-0.5">{timeAgo(post.createdAt)}</p>
                </div>
                {isAuthor && (
                    <button
                        onClick={() => onDelete(post._id)}
                        className="shrink-0 w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-surface-300 hover:text-red-500 transition-colors"
                        title="Delete post"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Content */}
            <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

            {/* Image */}
            {post.image && (
                <div className="mb-4 rounded-xl overflow-hidden border border-surface-100">
                    <img src={post.image} alt="Post attachment" className="w-full max-h-80 object-cover" loading="lazy" />
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-3 border-t border-surface-50">
                <button
                    onClick={() => onLike(post._id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${post.isLiked ? 'text-red-500' : 'text-surface-400 hover:text-red-400'}`}
                >
                    <svg className="w-4 h-4" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {post.likeCount || 0}
                </button>
                <button
                    onClick={() => onToggleComments(post._id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-surface-400 hover:text-brand-500 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {post.commentCount || 0} comment{post.commentCount !== 1 ? 's' : ''}
                </button>
            </div>
        </div>
    );
}

// ── Comment Section ─────────────────────────────────────────────────────
function CommentSection({ postId, currentUserId }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [sending, setSending] = useState(false);

    const fetchComments = useCallback(async () => {
        try {
            const res = await API.get(`/forum/posts/${postId}/comments`);
            setComments(res.data);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [postId]);

    useEffect(() => { fetchComments(); }, [fetchComments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || sending) return;
        setSending(true);
        try {
            const res = await API.post(`/forum/posts/${postId}/comments`, { content: newComment.trim() });
            setComments((prev) => [...prev, res.data]);
            setNewComment('');
        } catch { /* ignore */ }
        finally { setSending(false); }
    };

    const handleDelete = async (commentId) => {
        try {
            await API.delete(`/forum/comments/${commentId}`);
            setComments((prev) => prev.filter((c) => c._id !== commentId));
        } catch { /* ignore */ }
    };

    return (
        <div className="mt-3 pt-3 border-t border-surface-50">
            {loading ? (
                <div className="flex items-center gap-2 py-2 text-xs text-surface-400">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                    Loading comments...
                </div>
            ) : (
                <>
                    <div className="space-y-2.5 mb-3">
                        {comments.map((comment) => (
                            <div key={comment._id} className="flex items-start gap-2 group">
                                <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-[10px] font-bold shrink-0 mt-0.5">
                                    {(comment.author?.name || '?')[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="rounded-xl bg-surface-50 px-3 py-2">
                                        <p className="text-[10px] font-bold text-surface-700">{comment.author?.name}</p>
                                        <p className="text-xs text-surface-600 mt-0.5">{comment.content}</p>
                                    </div>
                                    <p className="text-[9px] text-surface-300 mt-0.5 px-1">{timeAgo(comment.createdAt)}</p>
                                </div>
                                {comment.author?._id === currentUserId && (
                                    <button
                                        onClick={() => handleDelete(comment._id)}
                                        className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-surface-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="input flex-1 text-xs py-2"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || sending}
                            className="btn-primary text-xs px-3 py-2 shrink-0"
                        >
                            Post
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}

// ── Main Forum Page ─────────────────────────────────────────────────────
export default function ForumPage() {
    const { user, company } = useAuth();
    const { socket } = useSocket();

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [expandedComments, setExpandedComments] = useState(new Set());

    // Create post form
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [postCategory, setPostCategory] = useState('general');
    const [creating, setCreating] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const fetchPosts = useCallback(async () => {
        try {
            const params = activeCategory !== 'all' ? `?category=${activeCategory}` : '';
            const res = await API.get(`/forum/posts${params}`);
            setPosts(res.data.posts || []);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [activeCategory]);

    useEffect(() => {
        setLoading(true);
        fetchPosts();
    }, [fetchPosts]);

    // Socket listeners for real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleNewPost = (post) => {
            // Don't add if it's our own post (already added optimistically)
            if (post.author?._id === user?.id) return;
            setPosts((prev) => {
                if (prev.find((p) => p._id === post._id)) return prev;
                return [post, ...prev];
            });
        };

        const handleNewComment = ({ postId, commentCount }) => {
            setPosts((prev) =>
                prev.map((p) => (p._id === postId ? { ...p, commentCount } : p))
            );
        };

        socket.on('new-forum-post', handleNewPost);
        socket.on('new-forum-comment', handleNewComment);

        return () => {
            socket.off('new-forum-post', handleNewPost);
            socket.off('new-forum-comment', handleNewComment);
        };
    }, [socket, user]);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!postContent.trim() || creating) return;
        setCreating(true);
        try {
            const formData = new FormData();
            formData.append('content', postContent.trim());
            formData.append('category', postCategory);
            if (imageFile) formData.append('image', imageFile);
            const res = await API.post('/forum/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setPosts((prev) => [res.data, ...prev]);
            setPostContent('');
            setPostCategory('general');
            setImageFile(null);
            setImagePreview(null);
            setShowCreateForm(false);
        } catch { /* ignore */ }
        finally { setCreating(false); }
    };

    const handleLike = async (postId) => {
        try {
            const res = await API.put(`/forum/posts/${postId}/like`);
            setPosts((prev) =>
                prev.map((p) =>
                    p._id === postId
                        ? { ...p, likeCount: res.data.likeCount, isLiked: res.data.isLiked }
                        : p
                )
            );
        } catch { /* ignore */ }
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('Delete this post? This cannot be undone.')) return;
        try {
            await API.delete(`/forum/posts/${postId}`);
            setPosts((prev) => prev.filter((p) => p._id !== postId));
        } catch { /* ignore */ }
    };

    const toggleComments = (postId) => {
        setExpandedComments((prev) => {
            const next = new Set(prev);
            if (next.has(postId)) next.delete(postId);
            else next.add(postId);
            return next;
        });
    };

    const accentColor = company?.primaryColor || '#6366f1';

    return (
        <div className="flex h-screen overflow-hidden bg-surface-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar title="Intern Forum" />

                <main className="flex-1 overflow-y-auto">
                    {/* Hero header */}
                    <div className="px-6 py-5 border-b border-surface-100 bg-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-lg font-extrabold text-surface-800">
                                    {company?.name || 'Company'} Forum
                                </h1>
                                <p className="text-xs text-surface-400 mt-0.5">
                                    Connect with your fellow interns — ask questions, share updates, introduce yourself
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateForm(!showCreateForm)}
                                className="btn-primary text-xs gap-1.5"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                New Post
                            </button>
                        </div>

                        {/* Category tabs */}
                        <div className="flex items-center gap-1.5 mt-4 overflow-x-auto">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap
                                        ${activeCategory === cat.id
                                            ? 'text-white shadow-sm'
                                            : 'bg-surface-50 text-surface-500 hover:bg-surface-100'
                                        }`}
                                    style={activeCategory === cat.id ? { backgroundColor: accentColor } : {}}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="max-w-2xl mx-auto px-6 py-5 space-y-4">

                        {/* Create post form */}
                        {showCreateForm && (
                            <div className="card border-2 border-dashed" style={{ borderColor: `${accentColor}30` }}>
                                <form onSubmit={handleCreatePost} className="space-y-4">
                                    <div>
                                        <label className="label">Category</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                                                const style = CAT_STYLES[cat.id];
                                                const isActive = postCategory === cat.id;
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        onClick={() => setPostCategory(cat.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                                                            ${isActive ? `${style.bg} ${style.text} ${style.border}` : 'bg-surface-50 text-surface-400 border-surface-100 hover:bg-surface-100'}`}
                                                    >
                                                        <span className="font-mono mr-1">{style.icon}</span>
                                                        {style.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label">What's on your mind?</label>
                                        <textarea
                                            value={postContent}
                                            onChange={(e) => setPostContent(e.target.value)}
                                            placeholder="Share something with your cohort..."
                                            rows={3}
                                            className="input resize-none"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Attach Image (optional)</label>
                                        <div className="flex items-center gap-3">
                                            <label className="btn-secondary text-xs cursor-pointer gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                Choose Image
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            setImageFile(file);
                                                            setImagePreview(URL.createObjectURL(file));
                                                        }
                                                    }}
                                                />
                                            </label>
                                            {imagePreview && (
                                                <div className="relative">
                                                    <img src={imagePreview} alt="Preview" className="h-12 w-12 rounded-lg object-cover border border-surface-200" />
                                                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[8px]">
                                                        x
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => { setShowCreateForm(false); setImageFile(null); setImagePreview(null); }} className="btn-secondary text-xs">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={!postContent.trim() || creating} className="btn-primary text-xs">
                                            {creating ? 'Posting...' : 'Post'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Posts */}
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-32 rounded-2xl bg-white animate-pulse border border-surface-100" />
                                ))}
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-7 h-7 text-surface-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold text-surface-400">No posts yet</p>
                                <p className="text-xs text-surface-300 mt-1">Be the first to share something with your cohort!</p>
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="btn-primary text-xs mt-4 mx-auto"
                                >
                                    Create First Post
                                </button>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <div key={post._id}>
                                    <PostCard
                                        post={post}
                                        currentUserId={user?.id}
                                        onLike={handleLike}
                                        onDelete={handleDelete}
                                        onToggleComments={toggleComments}
                                    />
                                    {expandedComments.has(post._id) && (
                                        <div className="card -mt-1 rounded-t-none border-t-0 pt-0">
                                            <CommentSection postId={post._id} currentUserId={user?.id} />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
