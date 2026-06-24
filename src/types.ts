/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TransactionItem {
  id: string; // client-side unique tracker
  تاریخ: string | null;
  شماره_سند: string | null;
  نام_طرف_حساب: string | null;
  شرح: string | null;
  مبلغ_بدهکار: number | null;
  مبلغ_بستانکار: number | null;
  نوع_ارز: string | null;
  توضیحات: string | null;
  ضریب_اطمینان: number | null;
  شناسه_ملی?: string | null;
  شماره_مالیاتی?: string | null;
  مالیات_ارزش_افزوده?: number | null;
  هزینه_غیرقابل_قبول?: boolean | null;
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
  documentType?: string;
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
}

export interface PreviousScan {
  id: string;
  file: UploadedFile;
  transactions: TransactionItem[];
  timestamp: number;
  auditLogs?: AuditLogEntry[];
}
