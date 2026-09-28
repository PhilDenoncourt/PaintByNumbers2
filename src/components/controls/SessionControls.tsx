import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { projectPersistence } from '../../projects/projectPersistence';

/** Compatibility control for older layouts; all paths use the shared project flow. */
export function SessionControls() {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  return <div className="space-y-2">
    <input ref={input} type="file" accept=".json" className="hidden" onChange={(event) => {
      const file = event.target.files?.[0];
      if (file) void projectPersistence.importFile(file).catch((error) => alert(String(error)));
      event.target.value = '';
    }} />
    <button onClick={() => input.current?.click()}>{t('export.loadSession')}</button>
    <button onClick={() => void projectPersistence.saveNow()}>{t('export.saveToBrowser')}</button>
    <button onClick={() => void projectPersistence.downloadCurrent()}>{t('export.exportSession')}</button>
  </div>;
}
