import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Scan, Secret } from '../types';
import { ScanHistory } from '../components/ScanHistory';
import { SecretTable } from '../components/SecretTable';
import { RefreshCw, ArrowLeft } from 'lucide-react';

interface ScanPageProps {
  selectedScanId: number | null;
  onSelectScan: (id: number | null) => void;
}

export function ScanPage({ selectedScanId, onSelectScan }: ScanPageProps) {
  const { request, loading } = useApi();
  const [scans, setScans] = useState<Scan[]>([]);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [activeScan, setActiveScan] = useState<Scan | null>(null);

  const fetchScans = async () => {
    const res = await request<{ scans: Scan[] }>('/api/v1/scans?limit=25');
    if (res.success && res.data?.scans) {
      setScans(res.data.scans);
    }
  };

  const fetchScanSecrets = async (scanId: number) => {
    const res = await request<Secret[]>(`/api/v1/scans/${scanId}/secrets`);
    if (res.success && res.data) {
      setSecrets(res.data);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [request]);

  useEffect(() => {
    if (selectedScanId) {
      const found = scans.find(s => s.id === selectedScanId);
      if (found) {
        setActiveScan(found);
      }
      fetchScanSecrets(selectedScanId);
    } else {
      setActiveScan(null);
      setSecrets([]);
    }
  }, [selectedScanId, scans]);

  return (
    <div className="space-y-6">
      {selectedScanId ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onSelectScan(null)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-xs font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Scan Executions
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-500">Scan #{selectedScanId}</span>
              {activeScan && (
                <span className="px-2.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 text-xs font-mono">
                  {activeScan.repo_name}
                </span>
              )}
            </div>
          </div>

          {activeScan && (
            <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 grid grid-cols-1 sm:grid-cols-4 gap-4 text-center transition-colors">
              <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-md border border-neutral-200 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 uppercase font-mono">Trigger Origin</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase mt-1">{activeScan.triggered_by}</p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-md border border-neutral-200 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 uppercase font-mono">Secrets Discovered</p>
                <p className="text-lg font-mono font-medium text-neutral-900 dark:text-neutral-100 mt-1">{activeScan.secrets_found}</p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-md border border-neutral-200 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 uppercase font-mono">Sanitized / Masked</p>
                <p className="text-lg font-mono font-medium text-neutral-900 dark:text-neutral-100 mt-1">{activeScan.secrets_sanitized}</p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-md border border-neutral-200 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 uppercase font-mono">Mock Bypassed</p>
                <p className="text-lg font-mono font-medium text-neutral-900 dark:text-neutral-100 mt-1">{activeScan.secrets_safe}</p>
              </div>
            </div>
          )}

          <SecretTable secrets={secrets} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Secret Scans &amp; Audit Logs</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Complete execution history of AST syntax inspections and regex/entropy scans.</p>
            </div>
            <button
              onClick={fetchScans}
              className="p-1.5 rounded-md bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              title="Refresh Scans"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <ScanHistory
            scans={scans}
            onSelectScan={(id) => onSelectScan(id)}
          />
        </div>
      )}
    </div>
  );
}
