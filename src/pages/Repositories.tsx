import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Repository } from '../types';
import { RepoManager } from '../components/RepoManager';

interface RepositoriesProps {
  onTriggerSync: (repoPath?: string, remoteUrl?: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, msg: string) => void;
}

export function Repositories({ onTriggerSync, onShowToast }: RepositoriesProps) {
  const { request } = useApi();
  const [repos, setRepos] = useState<Repository[]>([]);

  const fetchRepos = async () => {
    const res = await request<Repository[]>('/api/v1/workspace/repos');
    if (res.success && res.data) {
      setRepos(res.data);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, [request]);

  const handleAddRepo = async (localPath: string, remoteUrl?: string, name?: string): Promise<boolean> => {
    const res = await request<Repository>('/api/v1/workspace/repos', {
      method: 'POST',
      body: JSON.stringify({ local_path: localPath, remote_url: remoteUrl, name })
    });

    if (res.success) {
      onShowToast('success', 'Repository Added', `Successfully registered ${localPath} for monitoring.`);
      fetchRepos();
      return true;
    } else {
      onShowToast('error', 'Registration Failed', res.message || 'Could not add repository path.');
      return false;
    }
  };

  const handleDeleteRepo = async (id: number): Promise<boolean> => {
    const res = await request(`/api/v1/workspace/repos/${id}`, {
      method: 'DELETE'
    });

    if (res.success) {
      onShowToast('info', 'Repository Removed', 'Monitored directory path detached.');
      setRepos(repos.filter(r => r.id !== id));
      return true;
    }
    return false;
  };

  const handleSyncRepo = (localPath: string, remoteUrl?: string) => {
    onTriggerSync(localPath, remoteUrl);
    onShowToast('info', 'Synchronization Started', `Initiating AST scan and GitHub pipeline for ${localPath}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Monitored Repositories &amp; Workspaces</h2>
        <p className="text-xs text-neutral-500 mt-0.5">Register local folder paths to enable automated inspection and GitHub push synchronization.</p>
        
        <div className="mt-3 space-y-2">
          <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-neutral-800 dark:text-neutral-200 space-y-1.5">
            <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>🌟 Why didn't my commit show on my GitHub Profile contribution graph? (Fixed!)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
              <li><strong>Verified Email Binding (Active):</strong> We upgraded GitUpX to automatically query your primary GitHub email and bind <code className="bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded">author</code> and <code className="bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded">committer</code> tags on every commit. This guarantees GitHub attributes the commit to your profile's green contribution squares!</li>
              <li><strong>README Shield Badge (Active):</strong> GitUpX now automatically injects a live security shield badge into your repository's <code className="bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded">README.md</code> so visitors see your clean audit instantly on your repository landing page.</li>
              <li><strong>Private Repositories Notice:</strong> If your repo is Private, GitHub hides private commits from your profile timeline by default. To see them, go to your GitHub Profile → click <strong>Contribution settings</strong> (above the green square grid) → check <strong>'Private contributions'</strong>!</li>
            </ul>
          </div>

          <div className="p-2.5 rounded bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 font-mono flex items-center gap-2">
            <span className="text-amber-500 font-bold shrink-0">💡 Tip:</span>
            <span>To avoid <strong>"403 Resource not accessible"</strong> push errors, ensure your GitHub Fine-Grained PAT has <strong>Contents: Read and write</strong> permission under Repository permissions in Settings.</span>
          </div>
        </div>
      </div>

      <RepoManager
        repos={repos}
        onAddRepo={handleAddRepo}
        onDeleteRepo={handleDeleteRepo}
        onSyncRepo={handleSyncRepo}
      />
    </div>
  );
}
