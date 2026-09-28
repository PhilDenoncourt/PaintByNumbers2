import type { ActivePanel, LabelOverride, PipelineResult, PipelineSettings, ViewMode } from '../state/types';

export interface ProjectCheckpoint {
  id: string;
  resultId: string | null;
  settings: PipelineSettings;
  result: PipelineResult | null;
  resultSettings: PipelineSettings | null;
  labelOverrides: Record<number, LabelOverride>;
  paletteColorOrder: number[] | null;
  timestamp: number;
}

export interface LocalProject {
  version: 1;
  id: string;
  revision: number;
  createdAt: number;
  updatedAt: number;
  thumbnail: string;
  source: Blob;
  settings: PipelineSettings;
  result: PipelineResult | null;
  resultSettings: PipelineSettings | null;
  labelOverrides: Record<number, LabelOverride>;
  paletteColorOrder: number[] | null;
  history: ProjectCheckpoint[];
  historyIndex: number;
  historyTruncated: boolean;
  viewMode: ViewMode;
  activePanel: ActivePanel;
}

export type ProjectMetadata = Pick<LocalProject, 'id' | 'revision' | 'createdAt' | 'updatedAt' | 'thumbnail'>;
