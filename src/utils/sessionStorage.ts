import type { PipelineSettings, PipelineResult } from '../state/types';

export interface Session {
  settings: PipelineSettings;
  result: PipelineResult | null;
  sourceImageBase64: string;
  timestamp: number;
  name: string;
}

const STORAGE_KEY = 'pbn_session';

export const sessionStorage = {
  /**
   * Save current session to localStorage (auto-save)
   */
  autoSave: (
    settings: PipelineSettings,
    result: PipelineResult | null,
    imageUrl: string | null
  ): void => {
    if (!imageUrl) return;

    const canvas = document.createElement('canvas');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const base64 = canvas.toDataURL('image/png');

      const session: Session = {
        settings: { ...settings },
        result,
        sourceImageBase64: base64,
        timestamp: Date.now(),
        name: `Auto-save ${new Date().toLocaleTimeString()}`,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch (e) {
        console.warn('Failed to auto-save session:', e);
      }
    };
    img.src = imageUrl;
  },

  /**
   * Load session from localStorage
   */
  load: (): Session | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('Failed to load session:', e);
      return null;
    }
  },

  /**
   * Export session as JSON file
   */
  exportToFile: (
    settings: PipelineSettings,
    result: PipelineResult | null,
    imageUrl: string | null,
    filename: string = 'paint-by-numbers-session.json'
  ): void => {
    if (!imageUrl) return;

    const canvas = document.createElement('canvas');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const base64 = canvas.toDataURL('image/png');

      const session: Session = {
        settings: { ...settings },
        result,
        sourceImageBase64: base64,
        timestamp: Date.now(),
        name: filename.replace('.json', ''),
      };

      const jsonStr = JSON.stringify(session, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    img.src = imageUrl;
  },

  /**
   * Import session from JSON file
   */
  importFromFile: (file: File): Promise<Session> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const session = JSON.parse(e.target?.result as string) as Session;
          resolve(session);
        } catch (error) {
          reject(new Error('Invalid session file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },

  /**
   * Clear stored session
   */
  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear session:', e);
    }
  },
};
