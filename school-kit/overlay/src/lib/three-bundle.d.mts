export function bundleThreeVendor(
	rootDir: string,
	outDir?: string,
): Promise<{
	three: string;
	"three/addons/controls/OrbitControls.js": string;
}>;

export function getThreeModuleSources(
	rootDir: string,
): Promise<{
	three: string;
	"three/addons/controls/OrbitControls.js": string;
} | null>;
