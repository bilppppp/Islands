export interface RunBlock {
  lang: string;
  code: string;
}

export function collectRunBlocks(markdown: string, fileName?: string): RunBlock[];
export function assertRunBlocks(markdown: string, fileName?: string): RunBlock[];
