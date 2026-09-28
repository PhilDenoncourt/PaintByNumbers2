import { useState } from 'react';
import { projectPersistence, useProjectPersistence } from '../../projects/projectPersistence';
import { useProjectMessage } from '../../projects/projectMessages';

export function ResumeProjectCard() {
  const message = useProjectMessage();
  const { metadata, status, error } = useProjectPersistence();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  if (!metadata) return status === 'error' ? <p role="alert" className="text-sm text-amber-700">{error}</p> : null;
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setNotice(null);
    try { await action(); }
    catch (err) { setNotice(err instanceof Error ? err.message : message('loadFailed')); }
    finally { setBusy(false); }
  };
  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-gray-800 dark:border-blue-800 p-4" aria-label={message('resumeTitle')}>
      <div className="flex gap-4 items-center">
        {metadata.thumbnail && <img src={metadata.thumbnail} alt="" className="w-20 h-16 object-contain rounded bg-white" />}
        <div>
          <h2 className="font-semibold">{message('resumeTitle')}</h2>
          <p className="text-xs text-gray-600 dark:text-gray-300">{message('savedAt', new Date(metadata.updatedAt).toLocaleString())}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <button disabled={busy} onClick={() => void run(() => projectPersistence.resume())} className="px-3 py-2 rounded bg-blue-600 text-white text-sm">{message('resume')}</button>
        <button disabled={busy} onClick={() => void run(() => projectPersistence.downloadSaved())} className="px-3 py-2 rounded border text-sm">{message('downloadBackup')}</button>
        <button disabled={busy} onClick={() => void run(() => projectPersistence.deleteSaved())} className="px-3 py-2 rounded border text-sm">{message('delete')}</button>
      </div>
      <p className="text-xs mt-3 text-gray-600 dark:text-gray-300">{message('deviceNotice')}</p>
      {notice && <p role="alert" className="text-sm text-red-600 mt-2">{notice}</p>}
    </section>
  );
}
