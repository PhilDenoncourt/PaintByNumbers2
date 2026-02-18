import { useRef } from 'react';
import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';
import { rgbToHex } from '../../algorithms/colorUtils';

export function CustomPaletteControls() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);

  const disabled = pipelineStatus === 'running';
  const hasCustomPalette = settings.customPalette !== null && settings.customPalette.length > 0;

  const parseHexColors = (text: string): [number, number, number][] | null => {
    const hexRegex = /#?[0-9A-Fa-f]{6}/g;
    const matches = text.match(hexRegex);
    if (!matches || matches.length === 0) return null;

    return matches.map((hex) => {
      const clean = hex.replace('#', '');
      return [
        parseInt(clean.slice(0, 2), 16),
        parseInt(clean.slice(2, 4), 16),
        parseInt(clean.slice(4, 6), 16),
      ] as [number, number, number];
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let palette: [number, number, number][] | null = null;

        if (file.name.endsWith('.json')) {
          const data = JSON.parse(event.target?.result as string) as unknown[];
          if (Array.isArray(data)) {
            palette = data.map((c: unknown) => {
              if (Array.isArray(c) && c.length === 3) return c as [number, number, number];
              const obj = c as Record<string, unknown>;
              if (obj.r !== undefined && obj.g !== undefined && obj.b !== undefined) {
                return [obj.r as number, obj.g as number, obj.b as number] as [number, number, number];
              }
              return null;
            }).filter((p): p is [number, number, number] => p !== null);
          }
        } else if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
          const text = event.target?.result as string;
          palette = parseHexColors(text);
        }

        if (palette && palette.length > 0) {
          updateSettings({ customPalette: palette, paletteSize: palette.length });
          alert(`${t('controls.loadedPalette').replace('{{count}}', palette.length.toString())}`);
        } else {
          alert(t("controls.failedParse"));
        }
      } catch (err) {
        alert(`${t('controls.errorReading')}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePasteColors = () => {
    const text = textInputRef.current?.value || '';
    const palette = parseHexColors(text);

    if (palette && palette.length > 0) {
      updateSettings({ customPalette: palette, paletteSize: palette.length });
      alert(`${t('controls.loadedPalette').replace('{{count}}', palette.length.toString())}`);
    } else {
      alert(t('controls.noValidHex'));
    }
  };

  const handleClear = () => {
    updateSettings({ customPalette: null });
  };

  return (
    <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="text-sm font-medium text-gray-700">{t('controls.customPalette')}</h4>

      {hasCustomPalette && settings.customPalette && (
        <div className="space-y-2">
          <div className="text-xs text-gray-600">
            {t('controls.currentColors')}: {settings.customPalette.length} {t('controls.colorPlural')}
          </div>
          <div className="flex flex-wrap gap-1">
            {settings.customPalette.map((color, idx) => (
              <div
                key={idx}
                className="w-5 h-5 rounded border border-gray-300"
                style={{ backgroundColor: `rgb(${color[0]},${color[1]},${color[2]})` }}
                title={`#${rgbToHex(color[0], color[1], color[2])}`}
              />
            ))}
          </div>
          <button
            onClick={handleClear}
            disabled={disabled}
            className={`w-full py-1.5 px-3 rounded text-xs font-medium transition-colors ${
              disabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-red-100 text-red-600 hover:bg-red-200'
            }`}
          >
            {t('controls.clear')}
          </button>
        </div>
      )}

      {!hasCustomPalette && (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={`w-full py-1.5 px-3 rounded text-xs font-medium transition-colors ${
              disabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            {t('controls.uploadPaletteFile')}
          </button>

          <div className="text-xs text-gray-500">{t('controls.orPasteHex')}</div>
          <textarea
            ref={textInputRef}
            placeholder={t('controls.paletteExample')}
            disabled={disabled}
            className="w-full text-xs px-2 py-1 border border-gray-300 rounded resize-none"
            rows={2}
          />
          <button
            onClick={handlePasteColors}
            disabled={disabled}
            className={`w-full py-1.5 px-3 rounded text-xs font-medium transition-colors ${
              disabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
          >
            {t('controls.loadFromText')}
          </button>

          <p className="text-xs text-gray-400 leading-tight">
            {t('controls.paletteSupports')}
          </p>
        </div>
      )}
    </div>
  );
}
