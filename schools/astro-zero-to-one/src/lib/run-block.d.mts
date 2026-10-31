import type { CodeFence } from './predict-block.mjs';

export interface RunBlock {
  lang: string;
  code: string;
  mode?: 'run' | 'preview';
  runtime?: 'react' | 'preact';
}

export function normalizeRunLang(lang: string): string;
export function isRunnableLang(lang: string): boolean;
export function isPreviewLang(lang: string): boolean;
export function resolvePreviewRuntime(
  fenceInfoOrMeta?: string | { runtime?: string; explicitRuntime?: string; hasBothRuntimes?: boolean } | null,
  code?: string,
): 'react' | 'preact';
export function assertRunFence(fence: CodeFence, fileName?: string): RunBlock | null;
export function collectRunBlocks(markdown: string, fileName?: string): RunBlock[];
export function assertRunBlocks(markdown: string, fileName?: string): RunBlock[];
export function assertLessonCodeBlocks(markdown: string, fileName?: string): void;
export function buildPreviewDocument(options: {
  lang: string;
  code: string;
  runtime?: 'react' | 'preact';
  runtimeSources?: { preact?: string; hooks?: string; react?: string; [key: string]: unknown } | string[];
}): string;
