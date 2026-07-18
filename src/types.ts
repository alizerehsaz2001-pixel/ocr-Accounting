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
  tokensUsed?: number;
  tokenDetails?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    cachedContentTokenCount?: number;
  };
  audioNotes?: AudioNote[];
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
}
