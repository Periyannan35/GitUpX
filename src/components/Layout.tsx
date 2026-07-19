import React, { useState } from 'react';
import { Shield, LayoutDashboard, Search, FolderGit2, Settings, LogOut, Menu, X, Terminal } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scans', label: 'Secret Scans', icon: Search },
    { id: 'repositories', label: 'Repositories', icon: FolderGit2 },
    { id: 'settings', label: 'Settings & ML', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 flex flex-col md:flex-row selection:bg-neutral-200 dark:selection:bg-neutral-800 transition-colors">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex items-center gap-2.5 px-2 py-3 mb-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="w-7 h-7 rounded bg-black dark:bg-white flex items-center justify-center text-white dark:text-black shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-medium tracking-tight text-base text-neutral-900 dark:text-neutral-100">
              GitUpX
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Security Shield
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Minimal Status Widget */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-md border border-neutral-200 dark:border-neutral-800 mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              IDE Daemon
            </span>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold tracking-wider">ONLINE</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
              AST + ML Engine
            </span>
            <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400 font-bold tracking-wider">ACTIVE</span>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="text-xs truncate max-w-[150px]">
            <p className="font-medium text-neutral-800 dark:text-neutral-200 truncate">{user?.email || 'dev@gitupx.local'}</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              Authenticated
            </p>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-black border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-black dark:bg-white flex items-center justify-center text-white dark:text-black">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-base text-neutral-900 dark:text-neutral-100">GitUpX</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-black border-b border-neutral-200 dark:border-neutral-800 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate">{user?.email}</span>
            <button
              onClick={logout}
              className="px-3 py-1 rounded-md text-xs font-medium border border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-white dark:bg-black border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-10 transition-colors">
          <div>
            <h2 className="text-base font-medium text-neutral-900 dark:text-neutral-100 capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              Fail-Secure Mode: ON
            </span>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
