export interface UploadedDoc {
  id: string;
  originalName: string;
  savedAs: string;
  totalPages?: number;
  uploadedAt: string;
  fileSizeBytes: number;
  summary?: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  error?: boolean;
}

export interface BackendStatus {
  backendUrl: string;
  isReachable: boolean;
  pingMs: number;
  lastChecked: string;
  useProxy: boolean;
}
