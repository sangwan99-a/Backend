/**
 * Auto-Save Hook
 * Automatically saves drafts to IndexedDB
 */

import { useEffect, useRef, useCallback, useState } from 'react';

const DB_NAME = 'FusionDesk';
const DRAFTS_STORE = 'drafts';
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

interface Draft {
  id: string;
  module: string;
  data: any;
  lastSaved: number;
  lastModified: number;
}

/**
 * Open IndexedDB for drafts
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        db.createObjectStore(DRAFTS_STORE, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Save draft to database
 */
export async function saveDraft(id: string, module: string, data: any): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([DRAFTS_STORE], 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE);

    const draft: Draft = {
      id,
      module,
      data,
      lastSaved: Date.now(),
      lastModified: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const request = store.put(draft);
      request.onsuccess = () => {
        console.log(`💾 Draft saved: ${id}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save draft:', error);
  }
}

/**
 * Load draft from database
 */
export async function loadDraft(id: string): Promise<Draft | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([DRAFTS_STORE], 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const draft = request.result as Draft | undefined;
        if (draft) {
          console.log(`📖 Draft loaded: ${id}`);
        }
        resolve(draft || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to load draft:', error);
    return null;
  }
}

/**
 * Delete draft from database
 */
export async function deleteDraft(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([DRAFTS_STORE], 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log(`🗑️ Draft deleted: ${id}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to delete draft:', error);
  }
}

/**
 * Get all drafts for a module
 */
export async function getDraftsByModule(module: string): Promise<Draft[]> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([DRAFTS_STORE], 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const drafts = (request.result as Draft[]).filter((d) => d.module === module);
        resolve(drafts);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get drafts:', error);
    return [];
  }
}

/**
 * Hook for auto-saving drafts
 */
export function useAutoSave(id: string, module: string, data: any, enabled = true) {
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const dataHashRef = useRef<string>();

  // Simple hash function to detect changes
  const hashData = useCallback((obj: any) => {
    return JSON.stringify(obj).length.toString(36);
  }, []);

  useEffect(() => {
    if (!enabled || !data) return;

    const currentHash = hashData(data);

    // Only save if data has changed
    if (currentHash === dataHashRef.current) return;

    dataHashRef.current = currentHash;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debouncing
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft(id, module, data).catch((error) => {
        console.error('Auto-save failed:', error);
      });
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [id, module, data, enabled, hashData]);

  // Save immediately on unmount
  useEffect(() => {
    return () => {
      if (dataHashRef.current) {
        saveDraft(id, module, data).catch(() => {
          // Silent fail on unmount
        });
      }
    };
  }, []);
}

/**
 * Hook for draft recovery
 */
export function useDraftRecovery(module: string) {
  const [hasDrafts, setHasDrafts] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showRecovery, setShowRecovery] = useState(false);

  // Check for unsaved drafts on mount
  useEffect(() => {
    const checkDrafts = async () => {
      const moduleDrafts = await getDraftsByModule(module);
      setDrafts(moduleDrafts);
      setHasDrafts(moduleDrafts.length > 0);
      if (moduleDrafts.length > 0) {
        setShowRecovery(true);
      }
    };

    checkDrafts().catch(() => {
      // Silent fail
    });
  }, [module]);

  const recoverDraft = useCallback(
    async (draftId: string) => {
      const draft = await loadDraft(draftId);
      return draft?.data || null;
    },
    []
  );

  const discardDraft = useCallback(async (draftId: string) => {
    await deleteDraft(draftId);
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
  }, []);

  const discardAllDrafts = useCallback(async () => {
    await Promise.all(drafts.map((d) => deleteDraft(d.id)));
    setDrafts([]);
    setHasDrafts(false);
    setShowRecovery(false);
  }, [drafts]);

  return {
    hasDrafts,
    drafts,
    showRecovery,
    setShowRecovery,
    recoverDraft,
    discardDraft,
    discardAllDrafts,
  };
}

export default useAutoSave;
