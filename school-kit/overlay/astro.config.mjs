import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
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
		if (/(?:^|\s)preview(?:\s|$)/.test(rawMeta)) {
			node.properties["data-preview"] = "true";
			if (/(?:^|\s)react(?:\s|$)/.test(rawMeta)) {
				node.properties["data-runtime"] = "react";
			} else if (/(?:^|\s)preact(?:\s|$)/.test(rawMeta)) {
				node.properties["data-runtime"] = "preact";
			}
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
				let hasPythonRun = false;
				let hasReactPreview = false;
				for (const file of readdirSync(lessonsDir)) {
					if (file.endsWith(".md") || file.endsWith(".mdx")) {
						const text = readFileSync(join(lessonsDir, file), "utf-8");
						const blocks = collectRunBlocks(text);
						if (blocks.some((b) => b.lang === "python")) {
							hasPythonRun = true;
						}
						if (blocks.some((b) => b.mode === "preview" && b.runtime === "react")) {
							hasReactPreview = true;
						}
					}
				}
				if (hasPythonRun) {
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
				}
				if (hasReactPreview) {
					const reactVendorDir = resolve(rootDir, "public/vendor/react-preview");
					const outFile = join(reactVendorDir, "runtime.js");
					const versionFile = join(reactVendorDir, "version.json");
					const reactPkg = resolve(rootDir, "node_modules/react/package.json");
					const reactDomPkg = resolve(rootDir, "node_modules/react-dom/package.json");
					if (!existsSync(reactPkg) || !existsSync(reactDomPkg)) {
						throw new Error(
							`[pyodide-vendor] 课文包含 react preview 块，但在 ${rootDir} 中未找到 node_modules/react 或 react-dom。请在该 School 目录下执行 npm install 或运行 python3 scripts/apply-school-kit.py ${rootDir}。`,
						);
					}
					const reactVersion = JSON.parse(readFileSync(reactPkg, "utf-8")).version;
					const reactDomVersion = JSON.parse(readFileSync(reactDomPkg, "utf-8")).version;
					let needsBuild = !existsSync(outFile) || !existsSync(versionFile);
					if (!needsBuild) {
						try {
							const cached = JSON.parse(readFileSync(versionFile, "utf-8"));
							if (cached.react !== reactVersion || cached.reactDom !== reactDomVersion) {
								needsBuild = true;
							}
						} catch {
							needsBuild = true;
						}
					}
					if (needsBuild) {
						mkdirSync(reactVendorDir, { recursive: true });
						const req = createRequire(resolve(rootDir, "package.json"));
						const esbuild = req("esbuild");
						esbuild.buildSync({
							stdin: {
								contents:
									'import * as React from "react";\nimport * as ReactDOMClient from "react-dom/client";\nwindow.__islandReact = { React, ReactDOMClient };\n',
								resolveDir: rootDir,
								loader: "js",
							},
							bundle: true,
							format: "iife",
							minify: true,
							platform: "browser",
							define: { "process.env.NODE_ENV": '"production"' },
							outfile: outFile,
						});
						writeFileSync(
							versionFile,
							JSON.stringify({ react: reactVersion, reactDom: reactDomVersion }),
						);
					}
				} else {
					const reactVendorDir = resolve(rootDir, "public/vendor/react-preview");
					if (existsSync(reactVendorDir)) {
						rmSync(reactVendorDir, { recursive: true, force: true });
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

function preactUmdPlugin() {
	return {
		name: "preact-umd-raw",
		enforce: "pre",
		resolveId(id) {
			if (id.startsWith("preact/dist/preact.umd.js")) {
				const query = id.slice("preact/dist/preact.umd.js".length);
				return fileURLToPath(new URL("./node_modules/preact/dist/preact.umd.js", import.meta.url)) + query;
			}
			if (id.startsWith("preact/hooks/dist/hooks.umd.js")) {
				const query = id.slice("preact/hooks/dist/hooks.umd.js".length);
				return fileURLToPath(new URL("./node_modules/preact/hooks/dist/hooks.umd.js", import.meta.url)) + query;
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
	integrations: [mdx(), pyodideVendorIntegration()],
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
			theme: "vesper",
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
		plugins: [tailwindcss(), omitUnusedProgressStores(), preactUmdPlugin()].filter(Boolean),
		define: {
			"import.meta.env.SCHOOL_DEPLOY_TARGET": JSON.stringify(deployTarget),
		},
	},
});
