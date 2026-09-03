import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  LogOut,
  ExternalLink,
  X,
  Mail,
  Building,
  User,
  Users,
  Code,
  Globe,
  Video,
  FileText,
  ShieldCheck,
  FolderGit2,
  AlertCircle,
  Clock,
  ChevronRight,
  Database,
  Lock,
  KeyRound,
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ShowcaseDbRecord } from '../types';

export default function ShowcaseAdmin() {
  // Session & Auth state
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('admin@aidn.example');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Submissions state
  const [submissions, setSubmissions] = useState<ShowcaseDbRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    code?: string;
    details?: string | null;
    hint?: string | null;
  } | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<ShowcaseDbRecord | null>(null);

  // Monitor Supabase Auth state and load initial session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCheckingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSubmissions = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    setErrorDetails(null);

    try {
      const { data, error: supabaseError, status } = await supabase
        .from('showcase_submissions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      setLastCheckedAt(new Date().toLocaleTimeString());

      if (supabaseError) {
        const errorText = `Failed to load submissions: [${supabaseError.code || status || 'Error'}] ${supabaseError.message}`;
        setError(errorText);
        setErrorDetails({
          code: supabaseError.code,
          details: supabaseError.details,
          hint: supabaseError.hint,
        });
        setSubmissions([]);
      } else {
        setSubmissions(data || []);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred while fetching submissions.';
      setError(`Failed to load submissions: ${message}`);
      setSubmissions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch submissions whenever an authenticated session exists
  useEffect(() => {
    if (session) {
      fetchSubmissions();
    }
  }, [session, fetchSubmissions]);

  // Handle ESC key for detail modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedSubmission(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Admin Login with Supabase signInWithPassword
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error || !data.session) {
        // Do not reveal which credential was incorrect as instructed
        setLoginError('Invalid User ID or password.');
      } else {
        setSession(data.session);
        setLoginPassword('');
      }
    } catch {
      setLoginError('Invalid User ID or password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Admin Logout with Supabase signOut
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignored
    }
    setSession(null);
    setSubmissions([]);
    setSelectedSubmission(null);
    setSearchQuery('');
  };

  // Filter submissions based on search query
  const filteredSubmissions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return submissions;

    return submissions.filter((sub) => {
      const projectName = (sub.project_name || '').toLowerCase();
      const teamName = (sub.team_name || '').toLowerCase();
      const representative = (sub.team_representative || '').toLowerCase();
      const organization = (sub.organization || '').toLowerCase();
      const email = (sub.contact_email || '').toLowerCase();

      return (
        projectName.includes(query) ||
        teamName.includes(query) ||
        representative.includes(query) ||
        organization.includes(query) ||
        email.includes(query)
      );
    });
  }, [submissions, searchQuery]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return isoString;
    }
  };

  // 1. Loading Session state
  if (checkingSession) {
    return (
      <div className="min-h-screen w-full bg-[#030407] flex flex-col items-center justify-center text-zinc-400 font-mono text-xs space-y-3">
        <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
        <p>Checking authorization...</p>
      </div>
    );
  }

  // 2. Unauthenticated state -> Login Screen
  if (!session) {
    return (
      <div className="min-h-screen w-full bg-[#030407] text-zinc-100 font-sans antialiased selection:bg-blue-500/20 selection:text-blue-300 flex flex-col justify-center items-center px-4 sm:px-6">
        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto shadow-inner p-1.5">
              <img
                src="/Logo_transparent.png"
                alt="Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              Administrator Login
            </h1>
            <p className="text-xs text-zinc-400 font-mono">
              Hackers Occupied Pune · AIDN × Genesis
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>User ID / Email</span>
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@aidn.example"
                autoComplete="username"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-zinc-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all font-mono"
              />
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-200 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-mono text-xs font-medium tracking-wide transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-600/10"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 border-t border-zinc-900 text-center">
            <p className="text-[11px] font-mono text-zinc-600">
              Protected Administrator Portal · Supabase Auth
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated state -> Dashboard UI
  return (
    <div className="min-h-screen w-full bg-[#030407] text-zinc-100 font-sans antialiased selection:bg-blue-500/20 selection:text-blue-300">
      {/* Top Bar / Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-[#030407]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                Showcase Applications
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                {submissions.length === 1 ? '1 Submission' : `${submissions.length} Submissions`}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-0.5">
              Hackers Occupied Pune · AIDN × Genesis
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Authenticated User pill */}
            {session.user?.email && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                <User className="w-3 h-3 text-zinc-500" />
                <span className="max-w-[160px] truncate">{session.user.email}</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => fetchSubmissions(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh submissions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : 'text-zinc-400'}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-red-900/40 text-xs font-mono text-zinc-300 hover:text-red-400 transition-colors cursor-pointer"
              title="Sign out of Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search Bar & Quick Stats Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project, team, representative, organization, or email..."
              className="w-full pl-10 pr-9 py-2 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-zinc-500 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-zinc-600" />
            <span>Table: showcase_submissions</span>
            {searchQuery && (
              <span className="text-zinc-400">
                ({filteredSubmissions.length} filtered)
              </span>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 sm:p-5 rounded-xl bg-red-950/30 border border-red-900/60 text-red-200 text-xs sm:text-sm flex items-start gap-3.5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="font-semibold text-red-300 font-mono text-sm">
                {error}
              </p>
              {errorDetails && (
                <div className="p-3 rounded-lg bg-red-950/50 border border-red-900/40 font-mono text-xs text-red-300/90 space-y-1">
                  {errorDetails.code && <p><span className="text-red-400">PostgreSQL Code:</span> {errorDetails.code}</p>}
                  {errorDetails.details && <p><span className="text-red-400">Details:</span> {errorDetails.details}</p>}
                  {errorDetails.hint && <p><span className="text-red-400">Hint:</span> {errorDetails.hint}</p>}
                </div>
              )}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => fetchSubmissions(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-200 text-xs font-mono transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Query</span>
                </button>
                {lastCheckedAt && (
                  <span className="text-zinc-500 font-mono text-[11px]">
                    Last attempted: {lastCheckedAt}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-sm font-mono text-zinc-400">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 && !error ? (
          /* Empty Table State with RLS Diagnosis */
          <div className="space-y-4">
            <div className="py-12 px-6 rounded-xl border border-zinc-800/80 bg-zinc-950/40 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                <FolderGit2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-zinc-300 font-mono">No submissions yet.</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                The database query to <code className="text-zinc-400 font-mono">public.showcase_submissions</code> executed successfully and returned 0 visible rows.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fetchSubmissions(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Query</span>
                </button>
                {lastCheckedAt && (
                  <span className="text-zinc-500 font-mono text-[11px]">
                    Checked at: {lastCheckedAt}
                  </span>
                )}
              </div>
            </div>

            {/* Admin authorization guide banner */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 text-xs font-sans text-zinc-300 space-y-2">
              <div className="flex items-center gap-2 text-zinc-400 font-mono font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Admin Authorization Details</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                Authenticated as <code className="text-blue-300 font-mono">{session.user.email}</code> (Auth UUID: <code className="text-zinc-300 font-mono select-all">{session.user.id}</code>).
              </p>
              <p className="text-zinc-500 font-mono text-[11px]">
                Note: In accordance with PostgreSQL Row Level Security (RLS), this admin account must exist in <code className="text-zinc-400">public.admin_users</code> to access submission records.
              </p>
            </div>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          /* No search results */
          <div className="py-16 px-4 rounded-xl border border-zinc-800/80 bg-zinc-950/40 text-center space-y-2">
            <Search className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-sm font-semibold text-zinc-300 font-mono">No matching submissions found</p>
            <p className="text-xs text-zinc-500">
              No records match &quot;{searchQuery}&quot;. Try adjusting your search query.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 cursor-pointer"
            >
              <span>Clear search</span>
            </button>
          </div>
        ) : (
          /* Submissions Table with Horizontal Scroll */
          <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/50 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto dark-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 font-mono text-[11px] uppercase tracking-wider select-none">
                    <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Project</th>
                    <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Team</th>
                    <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Representative</th>
                    <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Organization</th>
                    <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Email</th>
                    <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Team Members</th>
                    <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Tech Stack</th>
                    <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-center">Repository</th>
                    <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-center">Prototype</th>
                    <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-center">Demo</th>
                    <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-center">Documentation</th>
                    <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans text-zinc-300">
                  {filteredSubmissions.map((sub) => (
                    <tr
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      className="hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                    >
                      {/* Project */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-white max-w-[200px] truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{sub.project_name}</span>
                          <ChevronRight className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>

                      {/* Team */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-300 max-w-[160px] truncate">
                        {sub.team_name}
                      </td>

                      {/* Representative */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-300 max-w-[150px] truncate">
                        {sub.team_representative}
                      </td>

                      {/* Organization */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-400 max-w-[160px] truncate">
                        {sub.organization}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-zinc-400 max-w-[180px] truncate">
                        {sub.contact_email}
                      </td>

                      {/* Team Members */}
                      <td className="py-3.5 px-4 max-w-[200px] truncate text-zinc-400" title={sub.team_members}>
                        {sub.team_members}
                      </td>

                      {/* Tech Stack */}
                      <td className="py-3.5 px-4 max-w-[180px] truncate text-zinc-400" title={sub.tech_stack}>
                        {sub.tech_stack}
                      </td>

                      {/* Repository */}
                      <td
                        className="py-3.5 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {sub.repository_url ? (
                          <a
                            href={sub.repository_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-blue-400 hover:text-blue-300 font-mono text-[11px] border border-zinc-800 transition-colors"
                            title={sub.repository_url}
                          >
                            <FolderGit2 className="w-3 h-3" />
                            <span>Repo</span>
                            <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Prototype */}
                      <td
                        className="py-3.5 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {sub.prototype_url ? (
                          <a
                            href={sub.prototype_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 font-mono text-[11px] border border-zinc-800 transition-colors"
                            title={sub.prototype_url}
                          >
                            <Globe className="w-3 h-3" />
                            <span>Live</span>
                            <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Demo Video */}
                      <td
                        className="py-3.5 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {sub.demo_video_url ? (
                          <a
                            href={sub.demo_video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-purple-400 hover:text-purple-300 font-mono text-[11px] border border-zinc-800 transition-colors"
                            title={sub.demo_video_url}
                          >
                            <Video className="w-3 h-3" />
                            <span>Video</span>
                            <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Documentation */}
                      <td
                        className="py-3.5 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {sub.documentation_url ? (
                          <a
                            href={sub.documentation_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 font-mono text-[11px] border border-zinc-800 transition-colors"
                            title={sub.documentation_url}
                          >
                            <FileText className="w-3 h-3" />
                            <span>Docs</span>
                            <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-zinc-600 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Submitted */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-zinc-500">
                        {formatDate(sub.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="py-3 px-4 bg-zinc-950/80 border-t border-zinc-800 text-xs font-mono text-zinc-500 flex items-center justify-between">
              <span>
                Showing {filteredSubmissions.length} of {submissions.length} total entries
              </span>
              <span className="text-[11px] text-zinc-600 hidden sm:inline">
                Click any row to view full project submission details
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Submission Detail Modal / Panel */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-800 flex items-start justify-between bg-zinc-900/40">
              <div className="space-y-1 pr-6">
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {selectedSubmission.team_name}
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {selectedSubmission.project_name}
                </h2>
                <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                  <span>{selectedSubmission.organization}</span>
                  <span>•</span>
                  <span>Submitted {formatDate(selectedSubmission.created_at)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm dark-scrollbar">
              {/* Project Overview */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold border-b border-zinc-800 pb-2 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  <span>Project Details</span>
                </h3>

                <div>
                  <h4 className="text-xs font-mono text-zinc-400 mb-1">Short Description</h4>
                  <p className="text-zinc-200 leading-relaxed bg-zinc-900/30 p-3 rounded-lg border border-zinc-900">
                    {selectedSubmission.short_description || '—'}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-mono text-zinc-400 mb-1">Problem Statement</h4>
                  <p className="text-zinc-300 leading-relaxed bg-zinc-900/30 p-3 rounded-lg border border-zinc-900 whitespace-pre-wrap">
                    {selectedSubmission.problem_statement || '—'}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-mono text-zinc-400 mb-1">Solution & Technical Approach</h4>
                  <p className="text-zinc-300 leading-relaxed bg-zinc-900/30 p-3 rounded-lg border border-zinc-900 whitespace-pre-wrap">
                    {selectedSubmission.solution_approach || '—'}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-mono text-zinc-400 mb-1">Technology Stack</h4>
                  <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/80 font-mono text-xs text-blue-300">
                    {selectedSubmission.tech_stack || '—'}
                  </div>
                </div>
              </div>

              {/* Team Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold border-b border-zinc-800 pb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Team & Organization</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-zinc-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      Representative
                    </span>
                    <p className="font-medium text-white">{selectedSubmission.team_representative}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-zinc-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      Contact Email
                    </span>
                    <a
                      href={`mailto:${selectedSubmission.contact_email}`}
                      className="font-mono text-blue-400 hover:underline block"
                    >
                      {selectedSubmission.contact_email}
                    </a>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-zinc-500 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-zinc-400" />
                      Organization / College
                    </span>
                    <p className="text-zinc-300">{selectedSubmission.organization}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-zinc-500">Social Handles</span>
                    <p className="font-mono text-xs text-zinc-300">
                      {selectedSubmission.social_handles || 'None provided'}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-mono text-zinc-500 block mb-1">Team Members</span>
                  <div className="p-3 bg-zinc-900/30 rounded-lg border border-zinc-900 text-zinc-300 leading-relaxed">
                    {selectedSubmission.team_members}
                  </div>
                </div>
              </div>

              {/* Project Deliverable URLs */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold border-b border-zinc-800 pb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>Project Deliverables & Links</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                        <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
                        Repository URL
                      </span>
                    </div>
                    {selectedSubmission.repository_url ? (
                      <a
                        href={selectedSubmission.repository_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-blue-400 hover:text-blue-300 hover:underline break-all"
                      >
                        <span className="truncate">{selectedSubmission.repository_url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-zinc-600 font-mono text-xs">Not provided</span>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        Prototype / Live Demo URL
                      </span>
                    </div>
                    {selectedSubmission.prototype_url ? (
                      <a
                        href={selectedSubmission.prototype_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-400 hover:text-emerald-300 hover:underline break-all"
                      >
                        <span className="truncate">{selectedSubmission.prototype_url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-zinc-600 font-mono text-xs">Not provided</span>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-purple-400" />
                        Demo Video URL
                      </span>
                    </div>
                    {selectedSubmission.demo_video_url ? (
                      <a
                        href={selectedSubmission.demo_video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-purple-400 hover:text-purple-300 hover:underline break-all"
                      >
                        <span className="truncate">{selectedSubmission.demo_video_url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-zinc-600 font-mono text-xs">Not provided</span>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        Documentation / Presentation
                      </span>
                    </div>
                    {selectedSubmission.documentation_url ? (
                      <a
                        href={selectedSubmission.documentation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-amber-400 hover:text-amber-300 hover:underline break-all"
                      >
                        <span className="truncate">{selectedSubmission.documentation_url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-zinc-600 font-mono text-xs">None provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Consent & Audit Trail */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Consent Given:</span>
                    <span className={selectedSubmission.consent_given ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                      {selectedSubmission.consent_given ? 'Yes (Showcase Permitted)' : 'No'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Record ID:</span>
                    <span className="text-zinc-400">{selectedSubmission.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
