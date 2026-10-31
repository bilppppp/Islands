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

export interface NumberlinePoint {
	label: string;
	value: number;
}

export interface NumberlineBlock {
	range: [number, number];
	points: NumberlinePoint[];
	step: number;
	show: ("opposite" | "abs" | "distance")[];
	caption: string;
}

export interface NumberlineBlockError {
	error: string;
}

export type ParseNumberlineBlockResult = NumberlineBlock | NumberlineBlockError;

export interface CodeFence {
	info: string;
	code: string;
	startLine: number;
	endLine: number;
	closed: boolean;
}

export function splitPipes(str: string): string[];
export function parseKeyValueBlock(
	source: string,
	options?: { multilineKey?: string | null },
): { pairs: Record<string, string>; error?: undefined } | { pairs?: undefined; error: string };
export function stripFrontmatter(markdown: string): string;
export function scanCodeFences(markdown: string): CodeFence[];
export function parsePredictBlock(source: string): ParsePredictBlockResult;
export function assertPredictFence(fence: CodeFence, fileName?: string): PredictBlock | null;
export function collectPredictBlocks(markdown: string, fileName?: string): string[];
export function assertPredictBlocks(markdown: string, fileName?: string): PredictBlock[];
export function parseNumberlineBlock(source: string): ParseNumberlineBlockResult;
export function assertNumberlineFence(fence: CodeFence, fileName?: string): NumberlineBlock | null;
export function collectNumberlineBlocks(markdown: string, fileName?: string): string[];
export function assertNumberlineBlocks(markdown: string, fileName?: string): NumberlineBlock[];
