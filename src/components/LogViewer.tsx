import React, { useRef, useEffect } from 'react';
import { LogMessage } from '../types';
import { Terminal, Trash2, AlertCircle, Info, Bug } from 'lucide-react';

interface LogViewerProps {
  logs: LogMessage[];
  onClear: () => void;
}

export function LogViewer({ logs, onClear }: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelIcon = (level: LogMessage['level']) => {
    switch (level) {
      case 'ERROR':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />;
      case 'WARNING':
        return <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />;
      case 'DEBUG':
        return <Bug className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
  };

  const getLevelBadge = (level: LogMessage['level']) => {
    let colors = "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    if (level === 'ERROR') colors = "border-rose-500/30 bg-rose-500/10 text-rose-400";
    if (level === 'WARNING') colors = "border-amber-500/30 bg-amber-500/10 text-amber-400";
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${colors}`}>
        {level}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden flex flex-col h-[360px] transition-colors">
      <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100">Live System Diagnostic Stream</h3>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Terminal Green</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-neutral-500">{logs.length} events</span>
          <button
            onClick={onClear}
            title="Clear Stream"
            className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2 bg-neutral-950 text-emerald-400">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-emerald-600/50">
            <Terminal className="w-6 h-6 mb-2 opacity-50" />
            <p>Diagnostic stream empty...</p>
          </div>
        ) : (
          logs.map((log) => {
            const isErr = log.level === 'ERROR';
            const isWarn = log.level === 'WARNING';
            return (
              <div key={log.id} className={`flex items-start gap-2.5 p-2 rounded hover:bg-emerald-950/40 transition-colors border-l-2 ${isErr ? 'border-rose-500' : isWarn ? 'border-amber-500' : 'border-emerald-500'}`}>
                <span className="text-emerald-600/70 shrink-0 select-none">[{log.timestamp}]</span>
                {getLevelIcon(log.level)}
                {getLevelBadge(log.level)}
                <span className="text-emerald-300/80 font-medium uppercase px-1.5 py-0.5 rounded border border-emerald-800/60 bg-emerald-900/30 text-[10px] shrink-0">
                  {log.source}
                </span>
                <span className={`break-all flex-1 ${isErr ? 'text-rose-300' : isWarn ? 'text-amber-200' : 'text-emerald-400 font-medium'}`}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
