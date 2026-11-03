import type { CodeFence } from './predict-block.mjs';

export interface RunBlock {
  lang: string;
  code: string;
  mode?: 'run' | 'preview';
  runtime?: 'react' | 'preact';
  demo?: boolean;
  usesThree?: boolean;
  warning?: string;
}

export const THREE_SPECIFIERS: Set<string>;

export function normalizeRunLang(lang: string): string;
export function isRunnableLang(lang: string): boolean;
export function isPreviewLang(lang: string): boolean;
export function collectImportSources(code?: string): string[];
export function previewUsesThree(code?: string): boolean;
export function buildModuleImportMap(moduleSources?: Record<string, string> | null): string;
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
  moduleSources?: Record<string, string>;
}): string;
