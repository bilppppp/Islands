export const PUBLICATION_GROUPS = [
	"编程语言、后端与开发环境",
	"Web 前端开发",
	"开发工具、云平台与部署",
	"AI Agent 与本地 AI",
	"数据科学、测试及其他应用",
	"游戏开发",
] as const;

export type PublicationGroup = (typeof PUBLICATION_GROUPS)[number];

export type SchoolPublication = {
	visibility?: "public" | "experimental";
	origin?: string;
	group?: string;
	prerequisites?: string;
	outcomes?: string;
};

export type PublicationConfig = {
	publicName?: string;
	description?: string;
	publication?: SchoolPublication;
};

export type CatalogLessonInput = {
	title: string;
	slug: string;
	order: number;
	body?: string;
};

export type CatalogLesson = {
	title: string;
	url: string;
};

export type PublicCatalog = {
	name: string;
	origin: string;
	group: PublicationGroup;
	intro: string;
	prerequisites: string;
	outcomes: string;
	lessons: CatalogLesson[];
	fingerprint: string;
};

export type CourseHtmlPages = {
	lessonList?: boolean;
	exerciseList?: boolean;
	glossary?: boolean;
	troubleshooting?: boolean;
};

export type PublicPublication = {
	visibility: "public";
	origin: string;
	group: PublicationGroup;
	prerequisites: string;
	outcomes: string;
	publicName: string;
	description: string;
};

export function isPublicVisibility(config: PublicationConfig): boolean {
	return config.publication?.visibility === "public";
}

export function shouldNoindex(config: PublicationConfig): boolean {
	return !isPublicVisibility(config);
}

export function parsePublicationOrigin(value: string): string {
	let parsed: URL;
	try {
		parsed = new URL(value);
	} catch {
		throw invalidPublicationOrigin(value);
	}
	if (parsed.protocol !== "https:") {
		throw invalidPublicationOrigin(value);
	}
	if (parsed.username !== "" || parsed.password !== "") {
		throw invalidPublicationOrigin(value);
	}
	if (parsed.hostname === "") {
		throw invalidPublicationOrigin(value);
	}
	if (parsed.pathname !== "/" && parsed.pathname !== "") {
		throw invalidPublicationOrigin(value);
	}
	if (parsed.search !== "" || parsed.hash !== "") {
		throw invalidPublicationOrigin(value);
	}
	if (value !== parsed.origin && value !== `${parsed.origin}/`) {
		throw invalidPublicationOrigin(value);
	}
	return parsed.origin;
}

export function lessonPath(slug: string): string {
	return `/lessons/${slug}`;
}

export function lessonUrl(origin: string, slug: string): string {
	return `${origin}${lessonPath(slug)}`;
}

export function exercisePath(slug: string): string {
	return `/exercises/${slug}`;
}

export function absolutePageUrl(origin: string, path: string): string {
	if (path === "/") return `${origin}/`;
	const normalized = path.startsWith("/") ? path : `/${path}`;
	return `${origin}${normalized}`;
}

export function sortByOrder<T extends { order: number }>(items: readonly T[]): T[] {
	return [...items].sort((a, b) => a.order - b.order);
}

export function requirePublicPublication(
	config: PublicationConfig,
	lessons: readonly unknown[],
): PublicPublication {
	if (!isPublicVisibility(config)) {
		throw new Error('Public catalog requires publication.visibility to be "public".');
	}
	const publication = config.publication;
	if (publication === undefined) {
		throw new Error("Public catalog is missing publication.");
	}
	const publicName = requiredText(config.publicName, "publicName");
	const description = requiredText(config.description, "description");
	const origin = parsePublicationOrigin(requiredText(publication.origin, "publication.origin"));
	const group = requiredGroup(publication.group);
	const prerequisites = requiredText(publication.prerequisites, "publication.prerequisites");
	const outcomes = requiredText(publication.outcomes, "publication.outcomes");
	if (lessons.length < 1) {
		throw new Error("A public course must have at least one lesson.");
	}
	return {
		visibility: "public",
		origin,
		group,
		prerequisites,
		outcomes,
		publicName,
		description,
	};
}

export function pageCanonicalUrl(
	config: PublicationConfig,
	pathname: string,
	lessons: readonly unknown[] = [],
): string {
	if (!isPublicVisibility(config)) {
		return pathname;
	}
	const publication = requirePublicPublication(config, lessons);
	return absolutePageUrl(publication.origin, pathname);
}

export function catalogHashInput(fields: {
	name: string;
	origin: string;
	group: string;
	intro: string;
	prerequisites: string;
	outcomes: string;
	lessons: readonly CatalogLesson[];
}): string {
	return JSON.stringify({
		name: fields.name,
		origin: fields.origin,
		group: fields.group,
		intro: fields.intro,
		prerequisites: fields.prerequisites,
		outcomes: fields.outcomes,
		lessons: fields.lessons.map((lesson) => ({
			title: lesson.title,
			url: lesson.url,
		})),
	});
}

export async function catalogFingerprint(fields: {
	name: string;
	origin: string;
	group: string;
	intro: string;
	prerequisites: string;
	outcomes: string;
	lessons: readonly CatalogLesson[];
}): Promise<string> {
	return sha256Hex(catalogHashInput(fields));
}

export async function buildCatalog(
	config: PublicationConfig,
	lessons: readonly CatalogLessonInput[],
): Promise<PublicCatalog> {
	const publication = requirePublicPublication(config, lessons);
	const catalogLessons = sortByOrder(lessons).map((lesson) => ({
		title: lesson.title,
		url: lessonUrl(publication.origin, lesson.slug),
	}));
	const fields = {
		name: publication.publicName,
		origin: publication.origin,
		group: publication.group,
		intro: publication.description,
		prerequisites: publication.prerequisites,
		outcomes: publication.outcomes,
		lessons: catalogLessons,
	};
	return {
		...fields,
		fingerprint: await catalogFingerprint(fields),
	};
}

export async function catalogResponse(
	config: PublicationConfig,
	lessons: readonly CatalogLessonInput[],
): Promise<{ status: 404 } | { status: 200; catalog: PublicCatalog }> {
	if (!isPublicVisibility(config)) {
		return { status: 404 };
	}
	return { status: 200, catalog: await buildCatalog(config, lessons) };
}

export function listCourseHtmlPaths(input: {
	lessons: readonly { slug: string; order: number }[];
	exercises?: readonly { slug: string; order: number }[];
	pages: CourseHtmlPages;
}): string[] {
	const paths = ["/"];
	if (input.pages.lessonList) paths.push("/lessons");
	for (const lesson of sortByOrder(input.lessons)) {
		paths.push(lessonPath(lesson.slug));
	}
	if (input.pages.exerciseList) paths.push("/exercises");
	for (const exercise of sortByOrder(input.exercises ?? [])) {
		paths.push(exercisePath(exercise.slug));
	}
	if (input.pages.glossary) paths.push("/glossary");
	if (input.pages.troubleshooting) paths.push("/troubleshooting");
	return paths;
}

export function sitemapXml(origin: string, paths: readonly string[]): string {
	const urls = paths
		.map((path) => `\t<url><loc>${escapeXml(absolutePageUrl(origin, path))}</loc></url>`)
		.join("\n");
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function sitemapResponse(
	config: PublicationConfig,
	input: {
		lessons: readonly { slug: string; order: number }[];
		exercises?: readonly { slug: string; order: number }[];
		pages: CourseHtmlPages;
	},
): { status: 404 } | { status: 200; body: string } {
	if (!isPublicVisibility(config)) {
		return { status: 404 };
	}
	const publication = requirePublicPublication(config, input.lessons);
	return {
		status: 200,
		body: sitemapXml(publication.origin, listCourseHtmlPaths(input)),
	};
}

export function robotsTxt(input: { advertiseSitemap: boolean; origin?: string }): string {
	const lines = [
		"User-agent: *",
		"Disallow: /api/",
		"Disallow: /sources/",
		"Disallow: /harness/",
	];
	if (input.advertiseSitemap) {
		const origin = input.origin;
		if (origin === undefined || origin === "") {
			throw new Error("Public robots.txt requires a publication origin.");
		}
		lines.push(`Sitemap: ${origin}/sitemap.xml`);
	}
	return `${lines.join("\n")}\n`;
}

export function robotsTextForConfig(
	config: PublicationConfig,
	lessons: readonly unknown[] = [],
): string {
	if (!isPublicVisibility(config)) {
		return robotsTxt({ advertiseSitemap: false });
	}
	const publication = requirePublicPublication(config, lessons);
	return robotsTxt({ advertiseSitemap: true, origin: publication.origin });
}

function requiredText(value: string | undefined, field: string): string {
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error(`Public course is missing ${field}.`);
	}
	return value;
}

function requiredGroup(value: string | undefined): PublicationGroup {
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error("Public course is missing publication.group.");
	}
	if (!PUBLICATION_GROUPS.includes(value as PublicationGroup)) {
		throw new Error(`Invalid publication.group: ${JSON.stringify(value)}`);
	}
	return value as PublicationGroup;
}

function invalidPublicationOrigin(value: string): Error {
	return new Error(`Invalid publication.origin: ${JSON.stringify(value)}`);
}

function escapeXml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

async function sha256Hex(text: string): Promise<string> {
	const bytes = new TextEncoder().encode(text);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
