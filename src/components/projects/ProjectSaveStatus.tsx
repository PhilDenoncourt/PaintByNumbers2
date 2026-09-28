import { projectPersistence, useProjectPersistence } from '../../projects/projectPersistence';
import { useAppStore } from '../../state/appStore';
import { useHistoryNotice, useProjectMessage } from '../../projects/projectMessages';

export function ProjectSaveStatus() {
  const message = useProjectMessage();
  const historyNotice = useHistoryNotice();
  const { metadata, status, error, remember } = useProjectPersistence();
  const sourceBlob = useAppStore((s) => s.sourceBlob);
  const historyTruncated = useAppStore((s) => s.historyTruncated);
  if (!sourceBlob) return null;
  return <div className="text-xs text-gray-600 dark:text-gray-300 flex flex-wrap items-center gap-2 px-4 sm:px-[30px] pb-2">
    <span role="status">{status === 'saving' ? message('saving') : status === 'saved' ? message('saved') :
      status === 'conflict' ? message('conflict') : status === 'error' ? message('saveFailed') : ''}</span>
    {error && <span role="alert">{error}</span>}
    {historyTruncated && <span>{historyNotice}</span>}
    {status === 'conflict' && <button className="underline" onClick={() => void projectPersistence.reloadLatest()}>{message('reloadLatest')}</button>}
    {(status === 'error' || status === 'conflict') && <button className="underline" onClick={() => void projectPersistence.downloadCurrent()}>{message('downloadBackup')}</button>}
    {metadata && <button className="underline" onClick={() => void projectPersistence.deleteSaved()}>{message('delete')}</button>}
    <label className="ml-auto flex items-center gap-1"><input type="checkbox" checked={remember} onChange={(e) => projectPersistence.setRemember(e.target.checked)} />{message('remember')}</label>
  </div>;
}
