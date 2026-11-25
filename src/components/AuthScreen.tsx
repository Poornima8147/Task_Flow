import React, {useState} from 'react';
import type {AuthError, SupabaseClient} from '@supabase/supabase-js';
import {AlertCircle, CheckCircle2, CheckSquare, Loader2, Lock, Mail} from 'lucide-react';

interface AuthScreenProps {
  supabase: SupabaseClient;
}

function formatAuthError(error: AuthError | unknown, mode: 'signin' | 'signup'): string {
  const errObj = error as {name?: string; status?: number; message?: string; code?: string} | null;
  const rawMessage = (errObj?.message || '').trim();
  const lower = rawMessage.toLowerCase();

  console.error('[TaskFlow Auth Error]', {
    mode,
    name: errObj?.name,
    status: errObj?.status,
    code: errObj?.code,
    message: rawMessage,
  });

  if (
    errObj?.name === 'AuthRetryableFetchError' ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('load failed') ||
    errObj?.status === 0
  ) {
    return 'Unable to reach Supabase Authentication. Please check your internet connection and verify that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured correctly.';
  }

  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please double-check your credentials and try again.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email address using the link sent to your inbox before signing in.';
  }

  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }

  if (lower.includes('invalid api key') || errObj?.status === 401) {
    return 'Supabase rejected the API key. Please verify that VITE_SUPABASE_ANON_KEY matches your Supabase publishable key.';
  }

  if (errObj?.status === 429 || lower.includes('rate limit')) {
    return 'Too many authentication attempts. Please wait a moment and try again.';
  }

  return rawMessage || 'Authentication failed. Please try again.';
}

export function AuthScreen({supabase}: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const {error} = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setErrorMessage(formatAuthError(error, 'signin'));
        }
      } else {
        const {data, error} = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) {
          setErrorMessage(formatAuthError(error, 'signup'));
        } else if (
          data.user &&
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0
        ) {
          setErrorMessage('An account with this email already exists. Please sign in instead.');
        } else if (data.user && !data.session) {
          setInfoMessage(
            'Account created. Please check your email inbox to confirm your address before signing in.',
          );
          setMode('signin');
        }
      }
    } catch (err) {
      setErrorMessage(formatAuthError(err, mode));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
            <CheckSquare className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
            TaskFlow
          </span>
        </div>

        <h1 className="font-display text-2xl font-semibold text-slate-900 tracking-tight mb-1.5">
          {mode === 'signin' ? 'Sign in to your workspace' : 'Create your TaskFlow account'}
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          {mode === 'signin'
            ? 'Access your personal tasks synced with Supabase PostgreSQL.'
            : 'Register an account to securely save and manage your tasks.'}
        </p>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-6" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div
            role="status"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700"
          >
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-medium text-sm px-4 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
