import React from 'react';
import { Scan } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck } from 'lucide-react';

interface ScanHistoryProps {
  scans: Scan[];
  onSelectScan?: (scanId: number) => void;
}

export function ScanHistory({ scans, onSelectScan }: ScanHistoryProps) {
  const getStatusBadge = (status: Scan['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'completed_with_warnings':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            Warnings
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
            <Clock className="w-3.5 h-3.5" />
            Running
          </span>
        );
    }
  };

  if (scans.length === 0) {
    return (
      <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-8 text-center transition-colors">
        <ShieldCheck className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">No Scan History</h3>
        <p className="text-xs text-neutral-500 mt-1">Run a secret scan or trigger workspace synchronization to view history.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden transition-colors">
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100">Recent Scan Executions</h3>
        <span className="text-xs font-mono text-neutral-500">{scans.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-800 dark:text-neutral-200">
          <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 text-xs font-medium uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
            <tr>
              <th className="py-3 px-6 font-medium">Repository</th>
              <th className="py-3 px-6 font-medium">Trigger</th>
              <th className="py-3 px-6 font-medium">Status</th>
              <th className="py-3 px-6 text-center font-medium">Secrets Found</th>
              <th className="py-3 px-6 text-center font-medium">Sanitized</th>
              <th className="py-3 px-6 text-center font-medium">Safe / Mock</th>
              <th className="py-3 px-6 text-right font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {scans.map((scan) => (
              <tr
                key={scan.id}
                onClick={() => onSelectScan && onSelectScan(scan.id)}
                className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors cursor-pointer"
              >
                <td className="py-3.5 px-6 font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white"></span>
                  {scan.repo_name}
                  {scan.push_result?.commit_hash && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      #{scan.push_result.commit_hash}
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-6">
                  <span className="font-mono text-xs px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 uppercase">
                    {scan.triggered_by}
                  </span>
                </td>
                <td className="py-3.5 px-6">{getStatusBadge(scan.status)}</td>
                <td className="py-3.5 px-6 text-center font-mono font-medium text-neutral-900 dark:text-neutral-100">
                  {scan.secrets_found}
                </td>
                <td className="py-3.5 px-6 text-center font-mono font-medium text-neutral-900 dark:text-neutral-100">
                  {scan.secrets_sanitized}
                </td>
                <td className="py-3.5 px-6 text-center font-mono font-medium text-neutral-700 dark:text-neutral-300">
                  {scan.secrets_safe}
                </td>
                <td className="py-3.5 px-6 text-right text-xs font-mono text-neutral-500">
                  {new Date(scan.started_at).toLocaleTimeString()} · {new Date(scan.started_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
