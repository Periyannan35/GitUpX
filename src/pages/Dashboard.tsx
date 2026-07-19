import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { DashboardStats, Scan, LogMessage } from '../types';
import { StatCard } from '../components/StatCard';
import { ScanHistory } from '../components/ScanHistory';
import { LogViewer } from '../components/LogViewer';
import { Shield, ShieldAlert, ShieldCheck, Activity, Play, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  logs: LogMessage[];
  onClearLogs: () => void;
  onSelectScan: (scanId: number) => void;
  onTriggerSync: () => void;
}

export function Dashboard({ logs, onClearLogs, onSelectScan, onTriggerSync }: DashboardProps) {
  const { request } = useApi();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [syncing, setSyncing] = useState(false);

  const fetchDashboardData = async () => {
    const statsRes = await request<DashboardStats>('/api/v1/dashboard/stats');
    if (statsRes.success && statsRes.data) {
      setStats(statsRes.data);
    }

    const scansRes = await request<{ scans: Scan[] }>('/api/v1/scans?limit=5');
    if (scansRes.success && scansRes.data?.scans) {
      setRecentScans(scansRes.data.scans);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [request]);

  const handleSyncClick = async () => {
    setSyncing(true);
    onTriggerSync();
    setTimeout(() => {
      setSyncing(false);
      fetchDashboardData();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 text-xs font-medium font-mono uppercase">
              Active Guard
            </span>
            <span className="text-xs text-neutral-500 font-mono">v1.0.0</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-neutral-900 dark:text-neutral-100 tracking-tight">
            AI Repository Sanitizer &amp; Safe GitHub Publisher
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
            Automatically scans your project for API keys and passwords before committing. Intelligently separates harmless test credentials from real production secrets, masks risks, and publishes clean code to GitHub.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={handleSyncClick}
            disabled={syncing}
            className="px-4 py-2.5 rounded-md bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            {syncing ? 'Synchronizing...' : 'Trigger Workspace Sync'}
          </button>
        </div>
      </div>

      {/* GitHub Contribution Attribution Banner */}
      <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base">🌟</span>
        <div className="space-y-1 text-xs text-neutral-800 dark:text-neutral-200">
          <div className="font-semibold text-emerald-700 dark:text-emerald-300">
            GitHub Contribution Graph Attribution Enabled
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[11px]">
            Why didn't earlier API commits show on your GitHub profile's green contribution squares? When committing via standard API without explicit email headers, GitHub does not credit user timelines. <strong>We just upgraded GitUpX to automatically query your verified GitHub primary email and bind it to author & committer headers on every commit!</strong> Also, GitUpX now automatically appends a live security shield badge to your repository's <code className="bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded">README.md</code>. Click <strong>Trigger Workspace Sync</strong> above to test!
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Total Scans Executed"
          value={stats?.total_scans ?? 0}
          icon={Activity}
          change="Active workspace"
        />
        <StatCard
          title="Potential Secrets Found"
          value={stats?.secrets_found ?? 0}
          icon={ShieldAlert}
          change="Total inspected"
        />
        <StatCard
          title="Production Secrets Sanitized"
          value={stats?.secrets_sanitized ?? 0}
          icon={Shield}
          change="Masked before commit"
        />
        <StatCard
          title="Mock / Test Secrets Safe"
          value={stats?.secrets_safe ?? 0}
          icon={ShieldCheck}
          change="Allowed test keys"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart: Scans over time */}
        <div className="lg:col-span-2 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 flex flex-col justify-between transition-colors">
          <div>
            <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 mb-1">Scan Activity &amp; Detection Trend (Last 7 Days)</h3>
            <p className="text-xs text-neutral-500 mb-6">Real-time daily scan frequency vs. secrets discovered</p>
          </div>
          <div className="h-[240px] w-full">
            {stats?.chart_data && stats.chart_data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#737373" fontSize={11} tickLine={false} />
                  <YAxis stroke="#737373" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '0.375rem', fontSize: '12px', color: '#f5f5f5' }}
                  />
                  <Area type="monotone" dataKey="scans" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={0.2} fill="#3b82f6" name="Scans Run" />
                  <Area type="monotone" dataKey="secrets" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={0.25} fill="#f43f5e" name="Secrets Found" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-500 text-xs font-mono">
                Loading analytics...
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart: Sanitized vs Mock */}
        <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 flex flex-col justify-between transition-colors">
          <div>
            <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 mb-1">AST + ML Action Split</h3>
            <p className="text-xs text-neutral-500 mb-4">Fail-secure production masking vs test bypass</p>
          </div>
          <div className="h-[200px] w-full flex items-center justify-center">
            {stats?.pie_data ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pie_data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.pie_data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '0.375rem', fontSize: '12px', color: '#f5f5f5' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-neutral-500 text-xs">Loading data...</div>
            )}
          </div>
          <div className="space-y-2.5 text-xs border-t border-neutral-200 dark:border-neutral-800 pt-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]"></span>
                Sanitized (Production)
              </span>
              <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">{stats?.secrets_sanitized ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"></span>
                Bypassed (Test / Mock)
              </span>
              <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">{stats?.secrets_safe ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans Table */}
      <ScanHistory scans={recentScans} onSelectScan={onSelectScan} />

      {/* Live System Logs */}
      <LogViewer logs={logs} onClear={onClearLogs} />
    </div>
  );
}
