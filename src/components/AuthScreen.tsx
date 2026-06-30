import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { LogIn, Mail, Lock, User, ArrowRight, Zap, ShieldCheck, Trophy, Map } from 'lucide-react';

const FEATURES = [
  { icon: ShieldCheck, label: 'AI Spam Shield', desc: 'Gemini verifies every report for authenticity' },
  { icon: Map, label: 'Live City Map', desc: 'Real-time issue tracking on an interactive map' },
  { icon: Trophy, label: 'Civic Bounties', desc: 'Earn points for verified infrastructure reports' },
  { icon: Zap, label: 'Predictive AI', desc: 'City-wide insights powered by generative AI' },
];

export default function AuthScreen() {
  const { login, loginEmailPassword, signUpEmailPassword } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await loginEmailPassword(email, password);
      } else {
        await signUpEmailPassword(email, password, name);
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') setError('Invalid email or password.');
      else if (err.code === 'auth/email-already-in-use') setError('An account with this email already exists.');
      else if (err.code === 'auth/weak-password') setError('Password should be at least 6 characters.');
      else setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-civic-bg overflow-hidden">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-civic-ink text-white p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 30% 70%, #1a6b3a 0%, transparent 60%), radial-gradient(circle at 80% 20%, #e8622a 0%, transparent 50%)`
        }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 opacity-[0.04]" style={{
          backgroundImage: `conic-gradient(from 0deg at 100% 100%, #fff 0%, transparent 25%)`
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <img src="/logo1.png" alt="Solvuno Logo" className="w-10 h-10 object-contain" />
            <span className="font-serif text-2xl font-bold tracking-tight">Solvuno</span>
          </div>

          <h1 className="font-serif text-[3.2rem] font-bold leading-[1.05] mb-6">
            Your city.<br/>Your voice.<br/><span className="text-civic-accent">Your fix.</span>
          </h1>
          <p className="font-sans text-white/60 text-[1rem] leading-relaxed mb-12">
            AI-powered civic reporting that connects residents, verifies issues, and drives real change.
          </p>

          <div className="flex flex-col gap-5">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={16} className="text-civic-accent" strokeWidth={2} />
                </div>
                <div>
                  <div className="font-sans font-semibold text-sm text-white">{label}</div>
                  <div className="font-sans text-xs text-white/50 mt-0.5 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 font-mono text-[0.65rem] text-white/25 uppercase tracking-widest">
          Solvuno · Civic Intelligence Platform
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `linear-gradient(var(--color-civic-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-civic-border) 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
        }} />

        <div className="relative z-10 w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10 justify-center">
            <img src="/logo1.png" alt="Solvuno Logo" className="w-10 h-10 object-contain" />
            <span className="font-serif text-2xl font-bold tracking-tight text-civic-ink">Solvuno</span>
          </div>

          <div className="bg-civic-surface border border-civic-border rounded-2xl p-8 shadow-xl">
            <h2 className="font-serif text-[1.8rem] font-bold text-civic-ink mb-1">
              {isLogin ? 'Welcome back' : 'Join the network'}
            </h2>
            <p className="font-sans text-sm text-civic-muted mb-8">
              {isLogin ? 'Sign in to track civic issues in your area.' : 'Create your account and start making a difference.'}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-sans mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-civic-muted uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-civic-muted" />
                    <input type="text" required value={name} onChange={e => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-10 pr-4 py-3 bg-civic-bg border border-civic-border rounded-xl font-sans text-sm outline-none focus:border-civic-ink focus:ring-2 focus:ring-civic-ink/10 transition-all" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-civic-muted uppercase tracking-wider mb-2">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-civic-muted" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-civic-bg border border-civic-border rounded-xl font-sans text-sm outline-none focus:border-civic-ink focus:ring-2 focus:ring-civic-ink/10 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-civic-muted uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-civic-muted" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-civic-bg border border-civic-border rounded-xl font-sans text-sm outline-none focus:border-civic-ink focus:ring-2 focus:ring-civic-ink/10 transition-all" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-civic-ink text-white rounded-xl font-sans font-semibold text-sm flex items-center justify-center gap-2 hover:bg-civic-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-md">
                {loading ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</span>
                ) : (
                  <><span>{isLogin ? 'Sign In' : 'Create Account'}</span><ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-civic-border" />
              <span className="font-sans text-xs text-civic-muted">or</span>
              <div className="flex-1 h-px bg-civic-border" />
            </div>

            <button onClick={login}
              className="w-full py-3 bg-civic-bg border border-civic-border rounded-xl font-sans text-sm font-medium text-civic-ink flex items-center justify-center gap-3 hover:border-civic-ink hover:bg-white transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>

            <p className="font-sans text-xs text-civic-muted text-center mt-6">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-civic-accent font-semibold hover:underline">
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
