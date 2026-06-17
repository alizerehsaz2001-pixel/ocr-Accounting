/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TransactionItem {
  id: string; // client-side unique tracker
  Date: string | null;
  Description: string | null;
  Debit: number | null;
  Credit: number | null;
  Remarks: string | null;
  ConfidenceScore: number | null;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  preview: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  error: string | null;
  results?: TransactionItem[];
  tokensUsed?: number;
}

export interface PreviousScan {
  id: string;
  file: UploadedFile;
  transactions: TransactionItem[];
  timestamp: number;
}
