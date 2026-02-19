import { useRef } from 'react';
import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';
import { sessionStorage } from '../../utils/sessionStorage';

export function SessionControls() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const sourceImageUrl = useAppStore((s) => s.sourceImageUrl);
  const settings = useAppStore((s) => s.settings);
  const result = useAppStore((s) => s.result);

  const canSave = sourceImageUrl !== null;
  const canExport = sourceImageUrl !== null;

  const handleAutoSave = () => {
    sessionStorage.autoSave(settings, result, sourceImageUrl);
    alert(t('export.autoSaveMessage'));
  };

  const handleExport = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    sessionStorage.exportToFile(
      settings,
      result,
      sourceImageUrl,
      `pbn-session-${timestamp}.json`
    );
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const session = await sessionStorage.importFromFile(file);
      
      // Load image from base64
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to create canvas');
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        // Set state
        const url = canvas.toDataURL('image/png');
        useAppStore.setState({
          sourceImageUrl: url,
          sourceImageData: imageData,
          processedWidth: imageData.width,
          processedHeight: imageData.height,
          settings: session.settings,
          result: session.result,
        });
        
        alert(t('export.sessionLoaded'));
      };
      img.src = session.sourceImageBase64;
    } catch (err) {
      alert(t('export.failedImportSession', { message: err instanceof Error ? err.message : t('common.unknownError') }));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />

      <button
        onClick={handleLoadClick}
        className="w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors bg-purple-500 text-white hover:bg-purple-600"
      >
        {t('export.loadSession')}
      </button>

      {canSave && (
        <>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide pt-2">{t('common.save')}</p>
          <button
            onClick={handleAutoSave}
            disabled={!canSave}
            className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              canSave
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {t('export.saveToBrowser')}
          </button>

          <button
            onClick={handleExport}
            disabled={!canExport}
            className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              canExport
                ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {t('export.exportSession')}
          </button>
        </>
      )}
    </div>
  );
}
