import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  isPositive?: boolean;
  color?: string; // Kept for compatibility, but ignored for strict monochrome styling
}

export function StatCard({ title, value, icon: Icon, change }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{title}</span>
        <div className="p-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-mono font-medium tracking-tight text-neutral-900 dark:text-neutral-100">{value}</span>
        {change && (
          <span className="text-xs font-medium px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300">
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
