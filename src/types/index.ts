export interface User {
  id: number;
  email: string;
  has_github_token: boolean;
  created_at: string;
}

export interface Repository {
  id: number;
  name: string;
  local_path: string;
  remote_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Scan {
  id: number;
  repo_id: number;
  repo_name: string;
  triggered_by: 'manual' | 'daemon' | 'git_hook' | 'manual_sync';
  status: 'running' | 'completed' | 'completed_with_warnings' | 'failed';
  started_at: string;
  completed_at: string | null;
  secrets_found: number;
  secrets_sanitized: number;
  secrets_safe: number;
  error_message: string | null;
  push_result?: {
    push_status: string;
    commit_hash?: string;
    remote_url?: string;
    message?: string;
  };
}

export interface ASTContext {
  variable_name: string;
  scope_type: 'global' | 'local' | 'class';
  parent_function_name: string;
  parent_class_name: string;
  is_assignment: boolean;
  is_test_context: boolean;
  lines_before: string[];
  lines_after: string[];
  file_path: string;
}

export interface Secret {
  id: number;
  file_path: string;
  line_number: number;
  matched_text: string;
  rule_name: string;
  entropy_score: number;
  ast_context: ASTContext | null;
  ml_classification: 'production_context' | 'mock_test_context' | null;
  ml_confidence: number;
  action_taken: 'sanitized' | 'safe_mock' | 'flagged';
  created_at: string;
}

export interface DashboardStats {
  total_scans: number;
  secrets_found: number;
  secrets_sanitized: number;
  secrets_safe: number;
  accuracy_percentage: number;
  chart_data: Array<{ date: string; scans: number; secrets: number }>;
  pie_data: Array<{ name: string; value: number; fill: string }>;
}

export interface MLTrainResult {
  accuracy: number;
  confusion_matrix: number[][];
  total_samples: number;
  model_path: string;
}

export interface LogMessage {
  id: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
  source: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}
