export const prerender = true;

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import config from "../../school.config";
import { sitemapResponse } from "../lib/publication";

const pageModules = import.meta.glob("./**/*.astro");

function hasSourcePage(relativePath: string): boolean {
	const needle = relativePath.replace(/^\.\//, "");
	return Object.keys(pageModules).some((key) => {
		const normalized = key.replace(/^\.\//, "");
		return normalized === needle || normalized.endsWith(`/${needle}`);
	});
}

export const GET: APIRoute = async () => {
	const lessons = await getCollection("lessons");
	const hasExercisePage = hasSourcePage("exercises/[slug].astro");
	const exercises = hasExercisePage ? await getCollection("exercises") : [];
	const result = sitemapResponse(config, {
		lessons: lessons.map((lesson) => ({
			slug: lesson.data.slug,
			order: lesson.data.order,
		})),
		exercises: exercises.map((exercise) => ({
			slug: exercise.data.slug,
			order: exercise.data.order,
		})),
		pages: {
			lessonList: hasSourcePage("lessons/index.astro"),
			exerciseList: hasSourcePage("exercises/index.astro"),
			glossary: hasSourcePage("glossary.astro"),
			troubleshooting: hasSourcePage("troubleshooting.astro"),
		},
	});
	if (result.status === 404) {
		return new Response(null, { status: 404 });
	}
	return new Response(result.body, {
		status: 200,
		headers: { "Content-Type": "application/xml; charset=utf-8" },
	});
};
