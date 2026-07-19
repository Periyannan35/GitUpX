import React, { useState } from 'react';
import { Repository } from '../types';
import { FolderGit2, Plus, Trash2, RefreshCw, CheckCircle2, Globe, HardDrive } from 'lucide-react';

interface RepoManagerProps {
  repos: Repository[];
  onAddRepo: (localPath: string, remoteUrl?: string, name?: string) => Promise<boolean>;
  onDeleteRepo: (id: number) => Promise<boolean>;
  onSyncRepo: (localPath: string, remoteUrl?: string) => void;
}

export function RepoManager({ repos, onAddRepo, onDeleteRepo, onSyncRepo }: RepoManagerProps) {
  const [localPath, setLocalPath] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localPath.trim()) {
      setErrorMsg('Local repository path is required.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    const success = await onAddRepo(localPath.trim(), remoteUrl.trim() || undefined, name.trim() || undefined);
    setIsSubmitting(false);
    if (success) {
      setLocalPath('');
      setRemoteUrl('');
      setName('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Repo Form */}
      <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 transition-colors">
        <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
          Register New Monitored Repository
        </h3>

        {errorMsg && (
          <div className="mb-4 p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs rounded-md">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase font-mono mb-1.5">
              Local Absolute Path *
            </label>
            <input
              type="text"
              placeholder="e.g. /Users/dev/my-project"
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              className="w-full bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase font-mono mb-1.5">
              Remote GitHub URL (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. https://github.com/username/project.git"
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
              className="w-full bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase font-mono mb-1.5">
              Friendly Display Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. my-backend"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400 transition-colors"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Repo List */}
      <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
            <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100">Active Workspace Repositories</h3>
          </div>
          <span className="text-xs font-mono text-neutral-500">{repos.length} registered</span>
        </div>

        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {repos.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-xs">
              No repositories added yet. Add a local directory path above to start automated scanning.
            </div>
          ) : (
            repos.map((repo) => (
              <div key={repo.id} className="p-4 md:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">{repo.name}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-[10px] font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Active Watch
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs text-neutral-500 font-mono">
                    <span className="flex items-center gap-1.5 truncate">
                      <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
                      {repo.local_path}
                    </span>
                    {repo.remote_url && (
                      <span className="flex items-center gap-1.5 truncate text-neutral-700 dark:text-neutral-300">
                        <Globe className="w-3.5 h-3.5" />
                        {repo.remote_url}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onSyncRepo(repo.local_path, repo.remote_url || undefined)}
                    title="Trigger Immediate Scan & Sync"
                    className="px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sync Now
                  </button>
                  <button
                    onClick={() => onDeleteRepo(repo.id)}
                    title="Remove Repository"
                    className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
