import { useCallback, useRef, useState } from 'react';
import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';
import { projectPersistence, useProjectPersistence } from '../../projects/projectPersistence';
import { useProjectMessage } from '../../projects/projectMessages';

export function ImageUploader({ onProjectStart }: { onProjectStart?: () => void }) {
  const { t } = useTranslation();
  const message = useProjectMessage();
  const loadImage = useAppStore((s) => s.loadImage);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { metadata, status } = useProjectPersistence();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const openFile = useCallback(async (file: File) => {
    try {
      setLoadError(null);
      if (file.type.startsWith('image/')) await loadImage(file);
      else if (file.name.endsWith('.json') || file.type === 'application/json') await projectPersistence.importFile(file);
    } catch (err) { setLoadError(err instanceof Error ? err.message : t('uploader.errorLoadingSession')); }
  }, [loadImage, t]);

  const handleImageFile = useCallback(
    async (file: File) => {
      if (status === 'loading') return;
      onProjectStart?.();
      if (metadata) setPendingFile(file);
      else await openFile(file);
    },
    [metadata, status, openFile, onProjectStart]
  );

  const handleSessionFile = useCallback(async (file: File) => {
    if (status === 'loading') return;
    onProjectStart?.();
    if (metadata) setPendingFile(file);
    else await openFile(file);
  }, [metadata, status, openFile, onProjectStart]);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type.startsWith('image/')) {
        await handleImageFile(file);
      } else if (file.name.endsWith('.json') || file.type === 'application/json') {
        await handleSessionFile(file);
      }
    },
    [handleImageFile, handleSessionFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) handleImageFile(file);
          break;
        }
      }
    },
    [handleImageFile]
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile]
  );

  return (
    <div
      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 sm:p-12 cursor-pointer transition-colors ${
        dragOver
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800'
      }`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onPaste={onPaste}
      onClick={() => {
        if (status !== 'loading') {
          onProjectStart?.();
          inputRef.current?.click();
        }
      }}
      aria-busy={status === 'loading'}
      tabIndex={0}
    >
      <svg
        className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">
        {t('uploader.dragDrop')}
      </p>
      <p className="text-gray-400 dark:text-gray-500 text-sm">
        {t('uploader.supportedFormats')}
      </p>
      <input
        ref={inputRef}
        type="file"
        disabled={status === 'loading'}
        accept="image/*,.json"
        className="hidden"
        onChange={onChange}
      />
      {loadError && <p role="alert" className="text-sm text-red-600 mt-2">{loadError}</p>}
      {pendingFile && metadata && <div className="mt-3 p-3 rounded border bg-white dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm mb-2">{message('replacePrompt')}</p>
        <div className="flex flex-wrap gap-2">
          <button className="text-sm underline" onClick={() => void projectPersistence.downloadSaved()}>{message('downloadBackup')}</button>
          <button className="text-sm underline" onClick={() => { const file = pendingFile; setPendingFile(null); void openFile(file); }}>{message('replace')}</button>
          <button className="text-sm underline" onClick={() => setPendingFile(null)}>{message('cancel')}</button>
        </div>
      </div>}
    </div>
  );
}
