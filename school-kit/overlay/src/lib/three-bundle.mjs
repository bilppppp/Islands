import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

export async function bundleThreeVendor(rootDir, outDir = resolve(rootDir, "public/vendor/three-preview")) {
	const threePkg = resolve(rootDir, "node_modules/three/package.json");
	if (!existsSync(threePkg)) {
		throw new Error(
			`[pyodide-vendor] 课文的 preview 块 import 了 three，但在 ${rootDir} 中未找到 node_modules/three。请在该 School 目录下执行 npm install 或运行 python3 scripts/apply-school-kit.py ${rootDir}。`,
		);
	}
	const threeVersion = JSON.parse(readFileSync(threePkg, "utf-8")).version;
	const versionFile = join(outDir, "version.json");
	const outputs = ["three.js", "orbit-controls.js"];
	let needsBuild = outputs.some((name) => !existsSync(join(outDir, name)));
	if (!needsBuild) {
		try {
			needsBuild = JSON.parse(readFileSync(versionFile, "utf-8")).three !== threeVersion;
		} catch {
			needsBuild = true;
		}
	}
	if (needsBuild) {
		mkdirSync(outDir, { recursive: true });
		const req = createRequire(resolve(rootDir, "package.json"));
		const esbuild = req("esbuild");
		const build = (contents, outfile, keepThreeExternal = false) =>
			esbuild.build({
				stdin: { contents, resolveDir: rootDir, loader: "js" },
				bundle: true,
				format: "esm",
				minify: true,
				platform: "browser",
				// Only the exact "three" specifier stays external ("external" would also skip three/addons/*).
				plugins: keepThreeExternal
					? [{ name: "three-external", setup(b) { b.onResolve({ filter: /^three$/ }, () => ({ path: "three", external: true })); } }]
					: [],
				outfile: join(outDir, outfile),
			});
		await build('export * from "three";\n', "three.js");
		// OrbitControls keeps its bare "three" import so the preview import map hands it the same instance.
		await build('export * from "three/addons/controls/OrbitControls.js";\n', "orbit-controls.js", true);
		writeFileSync(versionFile, JSON.stringify({ three: threeVersion }));
	}
	return {
		three: readFileSync(join(outDir, "three.js"), "utf-8"),
		"three/addons/controls/OrbitControls.js": readFileSync(join(outDir, "orbit-controls.js"), "utf-8"),
	};
}

export async function getThreeModuleSources(rootDir) {
	const threePkg = resolve(rootDir, "node_modules/three/package.json");
	if (!existsSync(threePkg)) {
		return null;
	}
	try {
		const outDir = resolve(rootDir, "public/vendor/three-preview");
		return await bundleThreeVendor(rootDir, outDir);
	} catch {
		return null;
	}
}
