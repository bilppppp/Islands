export const prerender = true;

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import config from "../../school.config";
import { catalogResponse } from "../lib/publication";

export const GET: APIRoute = async () => {
	const lessons = await getCollection("lessons");
	const result = await catalogResponse(
		config,
		lessons.map((lesson) => ({
			title: lesson.data.title,
			slug: lesson.data.slug,
			order: lesson.data.order,
			body: lesson.body,
		})),
	);
	if (result.status === 404) {
		return new Response(null, { status: 404 });
	}
	return new Response(JSON.stringify(result.catalog), {
		status: 200,
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
};
