import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import type { ActivePanel } from '../../state/types';
import { useStudioTokens, AMAZON_YELLOW } from './studioTokens';

interface StepDef {
  id: ActivePanel;
  n: number;
  /** Locked until a result exists (matches the old IconRail gating). */
  needsResult: boolean;
}

const STEPS: StepDef[] = [
  { id: 'palette', n: 1, needsResult: false },
  { id: 'adjust', n: 2, needsResult: false },
  { id: 'refine', n: 3, needsResult: true },
  { id: 'export', n: 4, needsResult: true },
];

/**
 * The painterly stepper: numbered round dots connected by lines, the active step
 * shown as a yellow dot. Replaces the old vertical IconRail as the step nav.
 */
export function StudioStepper() {
  const { t } = useTranslation();
  const tk = useStudioTokens();
  const activePanel = useAppStore((s) => s.ui.activePanel);
  const setActivePanel = useAppStore((s) => s.setActivePanel);
  const result = useAppStore((s) => s.result);

  return (
    <div
      className="px-4 sm:px-[30px] pb-3 overflow-x-auto pbn-sc"
      style={{ background: tk.headerBg }}
    >
      <div className="flex items-center min-w-max sm:min-w-0">
        {STEPS.map((s, i) => {
          const active = activePanel === s.id;
          const locked = s.needsResult && !result;
          const last = i === STEPS.length - 1;
          return (
            <div key={s.id} className="flex items-center" style={{ flex: last ? '0 0 auto' : '1 1 0%' }}>
              <button
                onClick={() => !locked && setActivePanel(s.id)}
                disabled={locked}
                aria-current={active ? 'step' : undefined}
                title={locked ? t('panels.lockedHint') : undefined}
                className={`flex items-center gap-[9px] shrink-0 ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className="w-[28px] h-[28px] rounded-full flex items-center justify-center font-display text-[13px] font-bold transition-colors"
                  style={
                    active
                      ? {
                          background: AMAZON_YELLOW,
                          color: tk.activeFg,
                          boxShadow: '0 4px 12px -3px rgba(255,216,20,.55)',
                        }
                      : { background: tk.dotIdleBg, color: tk.faint }
                  }
                >
                  {s.n}
                </span>
                <span
                  className="font-display text-[13px] font-semibold whitespace-nowrap"
                  style={{ color: active ? tk.text : tk.faint }}
                >
                  {t(`panels.${s.id}.tab`)}
                </span>
              </button>
              {!last && (
                <span
                  className="h-[3px] rounded-[2px] mx-[14px]"
                  style={{ flex: 1, minWidth: 18, background: tk.connector }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
