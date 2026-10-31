export interface PredictBlock {
	question: string;
	choices: string[] | null;
	answer: string;
	explain: string;
}

export interface PredictBlockError {
	error: string;
}

export type ParsePredictBlockResult = PredictBlock | PredictBlockError;

export interface CodeFence {
	info: string;
	code: string;
	startLine: number;
	endLine: number;
	closed: boolean;
}

export function stripFrontmatter(markdown: string): string;
export function scanCodeFences(markdown: string): CodeFence[];
export function parsePredictBlock(source: string): ParsePredictBlockResult;
export function collectPredictBlocks(markdown: string, fileName?: string): string[];
export function assertPredictBlocks(markdown: string, fileName?: string): PredictBlock[];
