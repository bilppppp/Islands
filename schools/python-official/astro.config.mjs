import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import islandTheme from "./src/styles/island-theme.json";
import react from "@astrojs/react";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, sessionDrivers } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkMath from "remark-math";
import { remarkSourceCite } from "./src/lib/source-cite.mjs";
import { collectRunBlocks } from "./src/lib/run-block.mjs";
import { assertVercelBuildEnv, resolveDeployTarget } from "./src/lib/deploy-target";

const deployTarget = resolveDeployTarget();
assertVercelBuildEnv();

const customLangs = ["predict", "numberline"].map((name) => ({
	name,
	scopeName: `source.${name}`,
	patterns: [],
}));

const runBlockTransformer = {
	name: "run-block-transformer",
	pre(node) {
		const rawMeta =
			typeof this.options.meta === "string"
				? this.options.meta
				: this.options.meta?.__raw ?? "";
		if (/(?:^|\s)run(?:\s|$)/.test(rawMeta)) {
			node.properties["data-run"] = "true";
		}
	},
};

function pyodideVendorIntegration() {
	return {
		name: "pyodide-vendor",
		hooks: {
			"astro:config:setup": ({ config }) => {
				const rootDir = fileURLToPath(config.root);
				const lessonsDir = resolve(rootDir, "src/content/lessons");
				if (!existsSync(lessonsDir)) return;
				let hasRun = false;
				for (const file of readdirSync(lessonsDir)) {
					if (file.endsWith(".md") || file.endsWith(".mdx")) {
						const text = readFileSync(join(lessonsDir, file), "utf-8");
						if (collectRunBlocks(text).length > 0) {
							hasRun = true;
							break;
						}
					}
				}
				if (!hasRun) return;
				const pkgDir = resolve(rootDir, "node_modules/pyodide");
				if (!existsSync(pkgDir)) {
					throw new Error(
						`[pyodide-vendor] 课文包含 python run 块，但在 ${rootDir} 中未找到 node_modules/pyodide。请在该 School 目录下执行 npm install 或运行 python3 scripts/apply-school-kit.py ${rootDir}。`,
					);
				}
				const vendorDir = resolve(rootDir, "public/vendor/pyodide");
				mkdirSync(vendorDir, { recursive: true });
				const filesToCopy = [
					"pyodide.mjs",
					"pyodide.asm.mjs",
					"pyodide.asm.wasm",
					"python_stdlib.zip",
					"pyodide-lock.json",
				];
				for (const name of filesToCopy) {
					const src = join(pkgDir, name);
					if (existsSync(src)) {
						const dst = join(vendorDir, name);
						if (!existsSync(dst) || statSync(src).size !== statSync(dst).size) {
							copyFileSync(src, dst);
						}
					}
				}
				for (const name of readdirSync(vendorDir)) {
					if (!filesToCopy.includes(name)) {
						rmSync(join(vendorDir, name), { force: true });
					}
				}
			},
		},
	};
}

const adapter =
	deployTarget === "node"
		? node({ mode: "standalone" })
		: deployTarget === "vercel"
			? vercel()
			: cloudflare({
					inspectorPort: false,
					imageService: "compile",
					...(deployTarget === "cloudflare"
						? { configPath: "wrangler.cloudflare.jsonc" }
						: {}),
				});

function omitUnusedProgressStores() {
	if (deployTarget === "dev") return undefined;
	return {
		name: "omit-unused-progress-stores",
		resolveId(id) {
			if (deployTarget !== "cloudflare" && id === "cloudflare:workers") {
				return "\0omit-cloudflare-workers";
			}
			if (id.includes("store-dev")) return "\0omit-store-dev";
			if (deployTarget !== "cloudflare" && id.includes("store-r2")) {
				return "\0omit-store-r2";
			}
		},
		load(id) {
			if (id === "\0omit-cloudflare-workers") {
				return "export const env = {};";
			}
			if (id === "\0omit-store-dev") {
				return "export async function createDevProgressStore() { throw new Error('Dev progress store is not available in this build'); }";
			}
			if (id === "\0omit-store-r2") {
				return "export function createR2ProgressStore() { throw new Error('R2 progress store is not available in this build'); }";
			}
		},
	};
}

export default defineConfig({
	session: {
		driver: sessionDrivers["null"](),
	},
	output: "server",
	cacheDir: "./.astro/cache",
	adapter,
	integrations: [mdx(), react(), pyodideVendorIntegration()],
	markdown: {
		remarkPlugins: [remarkMath, remarkSourceCite],
		rehypePlugins: [
			rehypeSlug,
			[
				rehypeAutolinkHeadings,
				{ behavior: "wrap", properties: { class: "heading-anchor" } },
			],
			[rehypeKatex, { throwOnError: false }],
		],
		shikiConfig: {
			theme: islandTheme,
			langs: customLangs,
			transformers: [runBlockTransformer],
		},
	},
	security: {
		checkOrigin: false,
	},
	vite: {
		server: { strictPort: true },
		cacheDir: "./.vite",
		plugins: [tailwindcss(), omitUnusedProgressStores()].filter(Boolean),
		ssr: {
			noExternal: ["animal-island-ui"],
		},
		resolve: {
			noExternal: ["animal-island-ui"],
		},
		define: {
			"import.meta.env.SCHOOL_DEPLOY_TARGET": JSON.stringify(deployTarget),
		},
	},
});
