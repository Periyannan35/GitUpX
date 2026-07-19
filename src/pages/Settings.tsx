import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { MLTrainResult } from '../types';
import { MLConfig } from '../components/MLConfig';
import { useAuth } from '../hooks/useAuth';
import { Settings as SettingsIcon, Github, Save, CheckCircle2 } from 'lucide-react';

interface SettingsProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, msg: string) => void;
}

export function Settings({ onShowToast }: SettingsProps) {
  const { updateGithubStatus } = useAuth();
  const { request } = useApi();
  const [ghToken, setGhToken] = useState(() => localStorage.getItem('gitupx_gh_token') || 'ghp_demo_secret_token_gitupx_2026');
  const [watchInterval, setWatchInterval] = useState('2');
  const [saved, setSaved] = useState(false);
  const [testingToken, setTestingToken] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; text: string } | null>(null);

  const handleTrainModel = async (): Promise<MLTrainResult | null> => {
    onShowToast('info', 'ML Training Initiated', 'Extracting TF-IDF features and fitting classifier...');
    const res = await request<MLTrainResult>('/api/v1/train', { method: 'POST' });
    if (res.success && res.data) {
      onShowToast('success', 'Model Trained', `Accuracy achieved: ${(res.data.accuracy * 100).toFixed(2)}%`);
      return res.data;
    } else {
      onShowToast('error', 'Training Error', res.message || 'Could not complete model training.');
      return null;
    }
  };

  const handleTestToken = async () => {
    if (!ghToken || ghToken.startsWith('ghp_demo_')) {
      setTestResult({ success: false, text: 'Please enter a valid GitHub Personal Access Token starting with ghp_ or github_pat_.' });
      onShowToast('error', 'Token Test Failed', 'Please paste a real GitHub PAT.');
      return;
    }
    setTestingToken(true);
    setTestResult(null);
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${ghToken.trim()}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const scopes = res.headers.get('x-oauth-scopes') || '';
        
        let permissionMsg = '';
        try {
          const storedRepos = JSON.parse(localStorage.getItem('gitupx_repos') || '[]');
          const targetRepo = storedRepos.find((r: any) => r.remote_url && !r.remote_url.includes('myusername') && !r.remote_url.includes('demo'));
          if (targetRepo) {
            const cleaned = targetRepo.remote_url.replace('https://github.com/', '').replace('http://github.com/', '').replace('.git', '').trim();
            const [owner, repo] = cleaned.split('/');
            if (owner && repo) {
              const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
                headers: { 'Authorization': `Bearer ${ghToken.trim()}`, 'Accept': 'application/vnd.github.v3+json' }
              });
              if (repoRes.ok) {
                const repoData = await repoRes.json();
                if (repoData.permissions && repoData.permissions.push === false) {
                  permissionMsg = ` ⚠️ WARNING: Your token has READ-ONLY access to ${owner}/${repo} ('push': false). Pushing will fail with 403! In GitHub Developer Settings, edit your token and change 'Contents' to 'Read and write'.`;
                } else if (repoData.permissions && repoData.permissions.push === true) {
                  permissionMsg = ` ✅ Confirmed read & write push access on ${owner}/${repo}.`;
                }
              }
            }
          }
        } catch (e) {}

        if (!permissionMsg && scopes && !scopes.includes('repo') && !scopes.includes('public_repo')) {
          permissionMsg = ` ⚠️ WARNING: Token missing 'repo' scope. Classic tokens require 'repo' checked to avoid 403 push errors.`;
        } else if (!permissionMsg && ghToken.startsWith('github_pat_')) {
          permissionMsg = ` (Tip: For Fine-Grained PATs, ensure 'Contents: Read and write' is enabled under Repository permissions to prevent 403 push errors).`;
        }

        setTestResult({ success: true, text: `Verified! Authenticated with GitHub as @${data.login} (${data.name || data.login}).${permissionMsg}` });
        localStorage.setItem('gitupx_gh_token', ghToken.trim());
        updateGithubStatus(true);
        onShowToast('success', 'GitHub Connected', `Verified token for user @${data.login}`);
      } else {
        setTestResult({ success: false, text: `GitHub API Error (${res.status}): Invalid token or insufficient permissions.` });
        onShowToast('error', 'Authentication Error', `GitHub responded with status ${res.status}`);
      }
    } catch (err: any) {
      setTestResult({ success: false, text: `Connection failed: Could not reach api.github.com.` });
      onShowToast('error', 'Network Error', 'Could not connect to GitHub API.');
    } finally {
      setTestingToken(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (ghToken) {
      localStorage.setItem('gitupx_gh_token', ghToken.trim());
    }
    updateGithubStatus(!!ghToken);
    setSaved(true);
    onShowToast('success', 'Settings Saved', 'Daemon interval and GitHub publisher credentials stored.');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">System Configuration &amp; ML Engine</h2>
        <p className="text-xs text-neutral-500 mt-0.5">Manage classifier weights, daemon monitoring frequencies, and GitHub credentials.</p>
      </div>

      {/* ML Classifier Section */}
      <MLConfig onTrainModel={handleTrainModel} />

      {/* Daemon & GitHub Settings Form */}
      <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 transition-colors">
        <div className="flex items-center gap-2 pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-6">
          <SettingsIcon className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
          <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100">Daemon &amp; Remote Publisher Preferences</h3>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                GitHub Personal Access Token (PAT)
              </label>
              <span className="text-[11px] text-neutral-500 font-mono">Active for Push</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Github className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={ghToken}
                onChange={(e) => setGhToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-md text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400 text-sm font-mono transition-colors"
              />
            </div>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestToken}
                disabled={testingToken}
                className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-xs font-medium rounded transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {testingToken ? 'Testing...' : 'Test PAT & Verify Connection'}
              </button>
              <span className="text-xs text-neutral-500">
                Verifies 'repo' and 'contents' scope with api.github.com.
              </span>
            </div>
            {testResult && (
              <div className={`mt-2 p-2.5 rounded text-xs flex items-center gap-2 border ${
                testResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}>
                {testResult.success && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />}
                {testResult.text}
              </div>
            )}

            <div className="mt-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-neutral-800 dark:text-neutral-200 text-xs space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span>⚠️ Got "403: Resource not accessible by personal access token"?</span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[11px]">
                When creating a GitHub Fine-Grained token, GitHub defaults repository file access to <strong>Read-only</strong>. To allow automated AST security commits:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-neutral-700 dark:text-neutral-300 font-mono text-[11px]">
                <li>Go to GitHub Developer Settings → Personal Access Tokens.</li>
                <li>Click your token name to edit its permissions.</li>
                <li>Under <strong>Repository permissions</strong>, change <strong>Contents</strong> from <span className="text-rose-500">Read-only</span> to <span className="text-emerald-500 font-semibold">Access: Read and write</span>.</li>
                <li>Save and click <strong>Test PAT</strong> above to confirm!</li>
              </ol>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Polling Interval (Seconds)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={watchInterval}
                onChange={(e) => setWatchInterval(e.target.value)}
                className="w-full bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Confidence Threshold
              </label>
              <input
                type="text"
                disabled
                value="0.70 (Strict Mode)"
                className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-500 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-4">
            <button
              type="submit"
              className="px-4 py-2 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black font-medium text-sm rounded-md transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Preferences
            </button>
            {saved && (
              <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Preferences updated successfully!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
