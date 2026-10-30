export const prerender = true;

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import config from "../../school.config";
import { robotsTextForConfig } from "../lib/publication";

export const GET: APIRoute = async () => {
	const lessons = await getCollection("lessons");
	return new Response(robotsTextForConfig(config, lessons), {
		status: 200,
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
};
