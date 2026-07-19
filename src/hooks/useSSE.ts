import { useState, useEffect, useRef } from 'react';
import { LogMessage } from '../types';

export function useSSE() {
  const [logs, setLogs] = useState<LogMessage[]>([
    { id: '1', level: 'INFO', message: 'GitUpX IDE Watcher Daemon initialized. Monitoring active sessions...', source: 'watcher', timestamp: new Date(Date.now() - 60000).toLocaleTimeString() },
    { id: '2', level: 'INFO', message: 'Loaded AST tree-sitter parsers for Python, JavaScript, TypeScript, Java, and Go.', source: 'ast_parser', timestamp: new Date(Date.now() - 45000).toLocaleTimeString() },
    { id: '3', level: 'INFO', message: 'ML TF-IDF + LogisticRegression Classifier active (Accuracy: 95.80%).', source: 'ml_model', timestamp: new Date(Date.now() - 30000).toLocaleTimeString() },
    { id: '4', level: 'INFO', message: 'Ready to intercept IDE closure and git staging hooks.', source: 'system', timestamp: new Date().toLocaleTimeString() }
  ]);
  const [isConnected, setIsConnected] = useState(true);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Limit buffer to last 100 messages
    const simulateRealTimeLogs = () => {
      const sampleEvents = [
        { level: 'INFO' as const, message: 'Polled active IDE sessions: VS Code, Cursor, PyCharm online.', source: 'watcher' },
        { level: 'DEBUG' as const, message: 'Shannon entropy background check on working directory clean.', source: 'scanner' },
        { level: 'INFO' as const, message: 'AST syntax tree validator verified zero syntax regressions.', source: 'sanitizer' },
        { level: 'INFO' as const, message: 'Git status check: clean working tree across 3 active repositories.', source: 'git_hook' }
      ];
      
      const randomEvt = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
      const newLog: LogMessage = {
        id: Math.random().toString(36).substring(2, 9),
        level: randomEvt.level,
        message: randomEvt.message,
        source: randomEvt.source,
        timestamp: new Date().toLocaleTimeString()
      };

      setLogs(prev => {
        const updated = [...prev, newLog];
        return updated.length > 100 ? updated.slice(-100) : updated;
      });
    };

    intervalRef.current = window.setInterval(simulateRealTimeLogs, 6000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const addLog = (level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG', message: string, source = 'system') => {
    setLogs(prev => {
      const updated = [...prev, {
        id: Math.random().toString(36).substring(2, 9),
        level,
        message,
        source,
        timestamp: new Date().toLocaleTimeString()
      }];
      return updated.length > 100 ? updated.slice(-100) : updated;
    });
  };

  const clearLogs = () => setLogs([]);

  return { logs, isConnected, addLog, clearLogs };
}
