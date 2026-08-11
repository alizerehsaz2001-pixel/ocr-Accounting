/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DynamicColumn {
  کلید: string;
  عنوان: string;
  نوع_داده: string;
}

export interface DynamicFieldValue {
  کلید: string;
  مقدار: string | number | null;
}

export interface DynamicRow {
  id: string; // client-side unique tracker
  ضریب_اطمینان: number | null;
  فیلد_ها: DynamicFieldValue[];
}

// Keep TransactionItem for backward compatibility with other modules, or map it.
export interface TransactionItem {
  id: string;
  [key: string]: any; // Allow dynamic fields
}

export interface AudioNote {
  id: string;
  url: string; // blob URL
  duration: number; // in seconds
  timestamp: number;
  noteText?: string;
}

export interface DocumentExtractionSettings {
  selectedModel: string;
  erpDestinationModule: string;
  strictnessMode: "balanced" | "speed" | "audit";
  customPrompt: string;
  pdfExtractionStrategy?: "direct" | "pdf_to_markdown_to_json";
  savedAt?: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  preview: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  error: string | null;
  results?: TransactionItem[];
  columns?: DynamicColumn[]; // Added for dynamic tables
  documentType?: string;
  mimeType?: string;
  documentAnalysis?: string;
  markdownContent?: string;
  tokensUsed?: number;
  tokenDetails?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    cachedContentTokenCount?: number;
  };
  audioNotes?: AudioNote[];
  extractionSettings?: DocumentExtractionSettings;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'auth';
  user?: {
    name: string;
    role: string;
  };
}

export interface PreviousScan {
  id: string;
  file: UploadedFile;
  transactions: TransactionItem[];
  columns?: DynamicColumn[]; // Added for dynamic tables
  timestamp: number;
  auditLogs?: AuditLogEntry[];
  folder?: string;
  isStarred?: boolean;
  tags?: string[];
  extractionSettings?: DocumentExtractionSettings;
}

export interface StorageRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userCompany?: string;
  requestedGB: number;
  planPriceToman: number;
  trackingCode: string;
  receiptNote?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  adminNote?: string;
}

