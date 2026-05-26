import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Interactive Mascot ─────────────────────────────────────────────────────
// A cute robot/creature that follows your cursor with its eyes,
// and covers its eyes when you type the password.
function Mascot({ isCoveringEyes, focusTarget }) {
    const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
    const mascotRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        if (isCoveringEyes || !mascotRef.current) return;
        const rect = mascotRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxMove = 4;
        const factor = Math.min(dist / 300, 1);
        setEyeOffset({
            x: (dx / (dist || 1)) * maxMove * factor,
            y: (dy / (dist || 1)) * maxMove * factor,
        });
    }, [isCoveringEyes]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [handleMouseMove]);

    useEffect(() => {
        if (isCoveringEyes) setEyeOffset({ x: 0, y: 0 });
    }, [isCoveringEyes]);

    const armAngle = isCoveringEyes ? -45 : 0;
    const armY = isCoveringEyes ? -10 : 0;

    return (
        <div ref={mascotRef} className="relative mx-auto" style={{ width: 120, height: 120 }}>
            <svg viewBox="0 0 120 120" width="120" height="120" className="drop-shadow-lg">
                {/* Body */}
                <ellipse cx="60" cy="85" rx="35" ry="25" fill="#6366f1" />
                
                {/* Head */}
                <circle cx="60" cy="48" r="32" fill="#818cf8" />
                <circle cx="60" cy="48" r="32" fill="url(#headGrad)" />
                
                {/* Ears */}
                <circle cx="32" cy="26" r="10" fill="#6366f1" />
                <circle cx="32" cy="26" r="6" fill="#a5b4fc" />
                <circle cx="88" cy="26" r="10" fill="#6366f1" />
                <circle cx="88" cy="26" r="6" fill="#a5b4fc" />

                {/* Eye whites */}
                <ellipse cx="45" cy="46" rx="11" ry="12" fill="white" />
                <ellipse cx="75" cy="46" rx="11" ry="12" fill="white" />

                {/* Pupils — follow mouse */}
                <g style={{ transition: 'transform 0.1s ease-out', transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }}>
                    <circle cx="46" cy="47" r="5.5" fill="#1e1b4b" />
                    <circle cx="44" cy="44.5" r="1.8" fill="white" opacity="0.9" />
                    <circle cx="76" cy="47" r="5.5" fill="#1e1b4b" />
                    <circle cx="74" cy="44.5" r="1.8" fill="white" opacity="0.9" />
                </g>

                {/* Eyebrows */}
                <line x1="36" y1="33" x2="52" y2="34" stroke="#4338ca" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="68" y1="34" x2="84" y2="33" stroke="#4338ca" strokeWidth="2.5" strokeLinecap="round" />

                {/* Nose */}
                <ellipse cx="60" cy="55" rx="3" ry="2" fill="#4338ca" />

                {/* Mouth — smile */}
                <path d="M50 60 Q60 68 70 60" fill="none" stroke="#4338ca" strokeWidth="2" strokeLinecap="round" />

                {/* Cheek blush */}
                <circle cx="35" cy="55" r="5" fill="#f9a8d4" opacity="0.4" />
                <circle cx="85" cy="55" r="5" fill="#f9a8d4" opacity="0.4" />

                {/* Arms / Hands — cover eyes when password focused */}
                <g style={{
                    transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transformOrigin: '35px 75px',
                    transform: `rotate(${armAngle}deg) translateY(${armY}px)`,
                }}>
                    {/* Left arm */}
                    <path d="M30 75 Q20 60 35 48" fill="none" stroke="#6366f1" strokeWidth="7" strokeLinecap="round" />
                    <circle cx="35" cy="46" r="6" fill="#818cf8" />
                </g>
                <g style={{
                    transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transformOrigin: '85px 75px',
                    transform: `rotate(${-armAngle}deg) translateY(${armY}px)`,
                }}>
                    {/* Right arm */}
                    <path d="M90 75 Q100 60 85 48" fill="none" stroke="#6366f1" strokeWidth="7" strokeLinecap="round" />
                    <circle cx="85" cy="46" r="6" fill="#818cf8" />
                </g>

                {/* Feet */}
                <ellipse cx="45" cy="108" rx="10" ry="5" fill="#4f46e5" />
                <ellipse cx="75" cy="108" rx="10" ry="5" fill="#4f46e5" />

                {/* Head gradient */}
                <defs>
                    <radialGradient id="headGrad" cx="40%" cy="30%" r="60%">
                        <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                    </radialGradient>
                </defs>
            </svg>
        </div>
    );
}

// ── Floating particle background ───────────────────────────────────────────
function FloatingParticles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => {
                const size = 3 + Math.random() * 5;
                const left = Math.random() * 100;
                const delay = Math.random() * 8;
                const duration = 6 + Math.random() * 10;
                const opacity = 0.1 + Math.random() * 0.2;
                return (
                    <div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: size,
                            height: size,
                            left: `${left}%`,
                            bottom: '-10px',
                            backgroundColor: i % 3 === 0 ? '#818cf8' : i % 3 === 1 ? '#a5b4fc' : '#c4b5fd',
                            opacity,
                            animation: `floatUp ${duration}s ${delay}s infinite ease-out`,
                        }}
                    />
                );
            })}
        </div>
    );
}

// ── Login Page ─────────────────────────────────────────────────────────────
export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            if (user.mustChangePassword) {
                navigate('/change-password', { replace: true });
            } else if (user.role === 'super_admin') {
                navigate('/super-admin', { replace: true });
            } else if (user.role === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%)' }}>

            {/* Ambient glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
                style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />

            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
            }} />

            {/* Floating particles */}
            <FloatingParticles />

            <div className="relative w-full max-w-[420px] animate-slide-up">

                {/* Mascot */}
                <div className="mb-2">
                    <Mascot isCoveringEyes={passwordFocused && !showPassword} />
                </div>

                {/* Card */}
                <div className="relative rounded-3xl overflow-hidden">
                    {/* Card glow border */}
                    <div className="absolute inset-0 rounded-3xl p-[1px]"
                        style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.3), rgba(139,92,246,0.1), rgba(129,140,248,0.2))' }}>
                        <div className="w-full h-full rounded-3xl bg-[#0f172a]" />
                    </div>

                    <div className="relative rounded-3xl p-8"
                        style={{ background: 'linear-gradient(180deg, rgba(30,27,75,0.95) 0%, rgba(15,23,42,0.98) 100%)', backdropFilter: 'blur(20px)' }}>

                        {/* Header */}
                        <div className="text-center mb-7">
                            <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h1>
                            <p className="text-sm text-indigo-300/50 mt-1">Sign in to your SmartOnboard account</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2.5 border border-red-500/20"
                                style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
                                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                                <span className="text-red-300">{error}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-indigo-300/60 uppercase tracking-wider mb-2">Email</label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                                        <svg className="w-4 h-4 text-indigo-400/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="login-email"
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="you@company.com"
                                        required
                                        className="login-input pl-10"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-semibold text-indigo-300/60 uppercase tracking-wider mb-2">Password</label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                                        <svg className="w-4 h-4 text-indigo-400/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                        placeholder="Enter your password"
                                        required
                                        className="login-input pl-10 pr-11"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400/40 hover:text-indigo-300 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                id="login-submit"
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: '#fff',
                                    boxShadow: '0 4px 15px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                                }}
                                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 25px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'; }}
                            >
                                {loading ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign in
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <p className="mt-6 text-center text-xs text-indigo-300/30">
                            Account access is managed by your company administrator.
                        </p>
                    </div>
                </div>

                {/* Bottom brand */}
                <div className="flex items-center justify-center gap-2 mt-6 opacity-30">
                    <svg className="w-4 h-4 text-indigo-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs text-indigo-300 font-semibold tracking-wider">SMARTONBOARD</span>
                </div>
            </div>

            {/* Float-up animation keyframes */}
            <style>{`
                @keyframes floatUp {
                    0% { transform: translateY(0) scale(1); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
                }
                .login-input {
                    width: 100%;
                    padding: 0.75rem 0.875rem;
                    border-radius: 0.75rem;
                    border: 1px solid rgba(99, 102, 241, 0.15);
                    background-color: rgba(255, 255, 255, 0.04);
                    font-size: 0.875rem;
                    color: #e0e7ff;
                    font-family: 'Inter', system-ui, sans-serif;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
                }
                .login-input::placeholder {
                    color: rgba(165, 180, 252, 0.25);
                }
                .login-input:focus {
                    border-color: rgba(99, 102, 241, 0.5);
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1), 0 0 20px rgba(99, 102, 241, 0.08);
                    background-color: rgba(255, 255, 255, 0.06);
                }
            `}</style>
        </div>
    );
}
