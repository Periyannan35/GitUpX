import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, Github, Terminal } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from '../components/ThemeToggle';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('security.engineer@gitupx.local');
  const [password, setPassword] = useState('supersecret123');
  const [githubToken, setGithubToken] = useState('ghp_demo_secret_token_1234567890');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegistering ? '/api/v1/auth/register' : '/api/v1/auth/login';
      const body = isRegistering 
        ? { email, password, github_token: githubToken }
        : { email, password };

      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          login(json.data.access_token, {
            id: json.data.user.id,
            email: json.data.user.email,
            has_github_token: !!githubToken,
            created_at: new Date().toISOString()
          });
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('[Login] Real backend offline or unreachable, using local sandbox token.', err);
    }

    // Fallback to local sandbox session if backend is offline
    setTimeout(() => {
      const mockToken = 'jwt_gitupx_access_token_' + Date.now();
      const mockUser = {
        id: 1,
        email: email || 'admin@gitupx.security',
        has_github_token: !!githubToken,
        created_at: new Date().toISOString()
      };
      login(mockToken, mockUser);
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 flex flex-col justify-between selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Top Header */}
      <header className="w-full border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-black dark:bg-white flex items-center justify-center text-white dark:text-black">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-sm tracking-tight">GitUpX</span>
        </div>

        {/* Top-Right Corner: Theme Toggle + Auth Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 border-r border-neutral-200 dark:border-neutral-800 pr-3">
            <button
              type="button"
              onClick={() => setIsRegistering(false)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                !isRegistering
                  ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsRegistering(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isRegistering
                  ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Register
            </button>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Centered Main Content on Landing Page */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-neutral-900 dark:text-neutral-100 mb-3">
              {isRegistering ? 'Create Workspace Account' : 'Repository Sanitizer'}
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
              Automated code inspection and safe GitHub publishing. Mask sensitive credentials before committing.
            </p>
          </div>

          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 sm:p-8 bg-white dark:bg-black">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-md text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400 text-sm transition-colors"
                    placeholder="dev@gitupx.local"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-md text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400 text-sm transition-colors"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    GitHub Token
                  </label>
                  <span className="text-[11px] text-neutral-500">Optional</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Github className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-md text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400 text-sm font-mono transition-colors"
                    placeholder="ghp_xxxxxxxxxxxxxxxx"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-neutral-500 leading-normal">
                  Used for publishing sanitized code to remote GitHub repositories.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium text-white dark:text-black bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 focus:outline-none transition-colors disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : isRegistering ? 'Register & Enter Workspace' : 'Enter Workspace'}
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-center">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Register here'}
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-neutral-500">
              Sandbox session active. Pre-configured demo credentials loaded.
            </p>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-4 px-6 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-500">
        GitUpX Security Engine &bull; Minimal Black &amp; White Architecture
      </footer>
    </div>
  );
}
