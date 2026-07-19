import React, { useState } from 'react';
import { Secret } from '../types';
import { ShieldAlert, ShieldCheck, FileCode, ChevronDown, ChevronUp, Cpu, Eye } from 'lucide-react';

interface SecretTableProps {
  secrets: Secret[];
}

export function SecretTable({ secrets }: SecretTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (secrets.length === 0) {
    return (
      <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-8 text-center transition-colors">
        <ShieldCheck className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Zero Vulnerabilities Detected</h3>
        <p className="text-xs text-neutral-500 mt-1">All checked files in the repository passed regex and entropy checks.</p>
      </div>
    );
  }

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden transition-colors">
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
          <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100">Detected Secret Findings &amp; AST Classifications</h3>
        </div>
        <span className="text-xs font-mono px-2.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
          {secrets.length} total
        </span>
      </div>

      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {secrets.map((sec) => {
          const isExpanded = expandedId === sec.id;
          const isSanitized = sec.action_taken === 'sanitized';
          const isSafe = sec.action_taken === 'safe_mock';

          return (
            <div key={sec.id} className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
              <div
                onClick={() => toggleExpand(sec.id)}
                className="p-4 md:px-6 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="p-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                    {isSanitized ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm truncate">{sec.rule_name}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400">
                        line {sec.line_number}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                        {sec.action_taken.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-neutral-500 truncate mt-1 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-neutral-400" />
                      {sec.file_path}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-mono text-neutral-500">Confidence</p>
                    <p className="text-sm font-mono font-medium text-neutral-900 dark:text-neutral-100">
                      {(sec.ml_confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <button className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="bg-neutral-50 dark:bg-neutral-900/50 p-6 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-black p-3.5 rounded-md border border-neutral-200 dark:border-neutral-800">
                      <p className="text-xs font-medium text-neutral-500 uppercase font-mono mb-1 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-neutral-400" />
                        Classification
                      </p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                        {sec.ml_classification?.replace('_', ' ') || 'Production Context'}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Entropy: <span className="font-mono text-neutral-700 dark:text-neutral-300">{sec.entropy_score}</span>
                      </p>
                    </div>

                    <div className="bg-white dark:bg-black p-3.5 rounded-md border border-neutral-200 dark:border-neutral-800">
                      <p className="text-xs font-medium text-neutral-500 uppercase font-mono mb-1">
                        AST Scope &amp; Variable
                      </p>
                      <p className="text-sm font-mono text-neutral-900 dark:text-neutral-100 truncate">
                        var: <span className="font-semibold">{sec.ast_context?.variable_name || 'N/A'}</span>
                      </p>
                      <p className="text-xs font-mono text-neutral-500 truncate mt-1">
                        fn: {sec.ast_context?.parent_function_name || 'top-level'} · scope: {sec.ast_context?.scope_type || 'global'}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-black p-3.5 rounded-md border border-neutral-200 dark:border-neutral-800">
                      <p className="text-xs font-medium text-neutral-500 uppercase font-mono mb-1 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-neutral-400" />
                        Masked Value
                      </p>
                      <p className="text-xs font-mono bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 truncate">
                        {sec.matched_text}
                      </p>
                    </div>
                  </div>

                  {/* Code snippet before/after */}
                  {sec.ast_context && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-neutral-500 uppercase font-mono">
                        AST Code Snippet &amp; Rewrite Diff
                      </p>
                      <div className="bg-white dark:bg-black p-4 rounded-md border border-neutral-200 dark:border-neutral-800 font-mono text-xs space-y-1 overflow-x-auto">
                        {sec.ast_context.lines_before?.map((line, i) => (
                          <div key={`pre-${i}`} className="text-neutral-500 px-2 py-0.5">
                            {sec.line_number - sec.ast_context!.lines_before.length + i} | {line}
                          </div>
                        ))}
                        <div className="bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-2 py-1 rounded border-l-2 border-black dark:border-white flex justify-between">
                          <span>{sec.line_number} | - {sec.matched_text} (original secret detected)</span>
                          <span className="text-[10px] text-neutral-500">[REMOVED]</span>
                        </div>
                        {isSanitized && (
                          <div className="bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 py-1 rounded border-l-2 border-neutral-500 flex justify-between">
                            <span>{sec.line_number} | + GITUPX_MASKED_SECRET_*** (AST rewritten)</span>
                            <span className="text-[10px] text-neutral-500">[INJECTED]</span>
                          </div>
                        )}
                        {sec.ast_context.lines_after?.map((line, i) => (
                          <div key={`post-${i}`} className="text-neutral-500 px-2 py-0.5">
                            {sec.line_number + 1 + i} | {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
