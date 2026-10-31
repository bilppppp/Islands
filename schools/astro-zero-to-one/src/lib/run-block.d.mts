import type { CodeFence } from './predict-block.mjs';

export interface RunBlock {
  lang: string;
  code: string;
}

export function normalizeRunLang(lang: string): string;
export function isRunnableLang(lang: string): boolean;
export function assertRunFence(fence: CodeFence, fileName?: string): RunBlock | null;
export function collectRunBlocks(markdown: string, fileName?: string): RunBlock[];
export function assertRunBlocks(markdown: string, fileName?: string): RunBlock[];
export function assertLessonCodeBlocks(markdown: string, fileName?: string): void;
