import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import type { ActivePanel } from '../../state/types';
import {
  PaletteIcon,
  AdjustIcon,
  RefineIcon,
  ExportIcon,
  UploadIcon,
} from '../icons';

interface TabDef {
  id: ActivePanel;
  label: string;
  Icon: (props: { className?: string }) => ReactElement;
  /** Tab is disabled until a result exists. */
  needsResult: boolean;
}

export function IconRail() {
  const { t } = useTranslation();
  const activePanel = useAppStore((s) => s.ui.activePanel);
  const setActivePanel = useAppStore((s) => s.setActivePanel);
  const reset = useAppStore((s) => s.reset);
  const result = useAppStore((s) => s.result);

  const tabs: TabDef[] = [
    { id: 'palette', label: t('panels.palette.tab'), Icon: PaletteIcon, needsResult: false },
    { id: 'adjust', label: t('panels.adjust.tab'), Icon: AdjustIcon, needsResult: false },
    { id: 'refine', label: t('panels.refine.tab'), Icon: RefineIcon, needsResult: true },
    { id: 'export', label: t('panels.export.tab'), Icon: ExportIcon, needsResult: true },
  ];

  return (
    <nav className="w-[78px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-stretch p-2 gap-1 shrink-0">
      {tabs.map(({ id, label, Icon, needsResult }) => {
        const active = activePanel === id;
        const locked = needsResult && !result;
        return (
          <button
            key={id}
            onClick={() => !locked && setActivePanel(id)}
            disabled={locked}
            title={locked ? t('panels.lockedHint') : label}
            aria-current={active ? 'page' : undefined}
            className={`relative flex flex-col items-center gap-[5px] py-[11px] px-1 rounded-[11px] transition-all duration-150 ${
              active
                ? 'bg-[#eff6ff] dark:bg-blue-500/15 text-[#2563eb] dark:text-blue-300'
                : 'bg-transparent text-[#64748b] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            } ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Icon className="w-[22px] h-[22px]" />
            <span className="text-[10px] font-semibold tracking-[0.01em]">{label}</span>
            {locked && (
              <span className="absolute top-[7px] right-[11px] text-[9px] text-gray-300 dark:text-gray-500">
                🔒
              </span>
            )}
          </button>
        );
      })}

      <div className="flex-1" />

      <button
        onClick={reset}
        title={t('sidebar.uploadNewImage')}
        className="flex flex-col items-center gap-[5px] py-[11px] px-1 rounded-[11px] text-[#94a3b8] dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-150 cursor-pointer"
      >
        <UploadIcon className="w-[22px] h-[22px]" />
        <span className="text-[10px] font-semibold">{t('panels.new')}</span>
      </button>
    </nav>
  );
}
