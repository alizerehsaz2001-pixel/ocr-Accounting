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
  tokenDetails?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

export interface PreviousScan {
  id: string;
  file: UploadedFile;
  transactions: TransactionItem[];
  timestamp: number;
}
