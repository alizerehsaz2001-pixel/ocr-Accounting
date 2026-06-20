/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'OcrAccountingVoiceNotesDB';
const STORE_NAME = 'voice_notes';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export interface StoredAudioNote {
  id: string; // format: "fileId_noteId"
  fileId: string;
  noteId: string;
  blob: Blob;
  duration: number;
  timestamp: number;
  noteText?: string;
}

export interface AudioNote {
  id: string;
  url: string; // transient Object URL
  duration: number;
  timestamp: number;
  noteText?: string;
}

export async function saveAudioNoteInDB(
  fileId: string,
  noteId: string,
  blob: Blob,
  duration: number,
  timestamp: number,
  noteText?: string
): Promise<AudioNote> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const record: StoredAudioNote = {
      id: `${fileId}_${noteId}`,
      fileId,
      noteId,
      blob,
      duration,
      timestamp,
      noteText
    };
    
    const request = store.put(record);
    
    request.onsuccess = () => {
      const url = URL.createObjectURL(blob);
      resolve({
        id: noteId,
        url,
        duration,
        timestamp,
        noteText
      });
    };
    
    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function getAudioNotesFromDB(fileId: string): Promise<AudioNote[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const notes: AudioNote[] = [];
      
      const request = store.openCursor();
      
      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          const value: StoredAudioNote = cursor.value;
          if (value.fileId === fileId) {
            const url = URL.createObjectURL(value.blob);
            notes.push({
              id: value.noteId,
              url,
              duration: value.duration,
              timestamp: value.timestamp,
              noteText: value.noteText
            });
          }
          cursor.continue();
        } else {
          notes.sort((a, b) => b.timestamp - a.timestamp);
          resolve(notes);
        }
      };
      
      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error("IndexedDB is not available or failed initialization:", error);
    return [];
  }
}

export async function deleteAudioNoteFromDB(fileId: string, noteId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(`${fileId}_${noteId}`);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function updateAudioNoteTextInDB(fileId: string, noteId: string, noteText: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const id = `${fileId}_${noteId}`;
    
    const getReq = store.get(id);
    getReq.onsuccess = (event: any) => {
      const record: StoredAudioNote = event.target.result;
      if (record) {
        record.noteText = noteText;
        const putReq = store.put(record);
        putReq.onsuccess = () => resolve();
        putReq.onerror = (e: any) => reject(e.target.error);
      } else {
        reject(new Error('Record not found'));
      }
    };
    getReq.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}
