import type { SchoolConfig } from "./src/lib/school";

const config: SchoolConfig = {
	chrome: "island",
	name: "python-official",
	publicName: "Python 官方教程 AI 互动课程",
	shortName: "Python 官方教程",
	description: "零基础读者按 Python 官方教程目录学完第 1 至 12 章：解释器、数字与字符串、数据结构、流程控制、函数、模块、输入输出、错误和异常、类、标准库概览与虚拟环境。学完能独立编写文本处理小脚本：读入文字，用列表或字典整理，用函数处理，写进文件，辨识错误类型，并知道如何放入虚拟环境。",
	publication: {
		visibility: "public",
		origin: "https://python-official.learnislands.com",
		group: "编程语言、后端与开发环境",
		prerequisites: "零基础，不需要先学别的课。安装步骤写在课文里，完成条件不要求本机已经装好 Python。",
		outcomes: "学完官方教程第 1 到 12 章，能独立写一个文本处理小脚本：读入文字，用列表或字典整理，用函数处理，写进文件，辨识错误类型，并知道如何放入虚拟环境。",
	},
	adjectives: [
		"bright",
		"clever",
		"cosmic",
		"curious",
		"eager",
		"golden",
		"keen",
		"mighty",
		"nimble",
		"radiant",
		"sharp",
		"steady",
	],
	nouns: [
		"builder",
		"explorer",
		"learner",
		"maker",
		"pioneer",
		"scholar",
		"seeker",
		"student",
		"thinker",
		"tinkerer",
		"traveler",
		"wizard",
	],
	colors: [
		"red",
		"orange",
		"amber",
		"yellow",
		"lime",
		"green",
		"emerald",
		"teal",
		"cyan",
		"sky",
		"blue",
		"indigo",
		"violet",
		"purple",
		"fuchsia",
		"pink",
		"rose",
		"slate",
	],
	profileFields: {
		learningStyle: {
			question: "How do you prefer to learn?",
			type: "single",
			options: [
				{
					value: "concepts-first",
					label: "Explain concepts first",
					description:
						"Understand the concept, then see practical applications",
				},
				{
					value: "hands-on",
					label: "Jump into hands-on exploration",
					description: "Start doing things, learn concepts as they come up",
				},
				{
					value: "examples",
					label: "Show me examples",
					description: "See concrete examples first, then infer the patterns",
				},
			],
			adaptation: {
				"concepts-first":
					"Explain the concept, then show the practical application.",
				"hands-on":
					"Jump straight to doing things, explain as concepts come up.",
				examples:
					"Lead with concrete examples, let the student infer the pattern.",
			},
		},
		depthPreference: {
			question: "How much detail do you want?",
			type: "single",
			options: [
				{
					value: "brief",
					label: "Keep it brief",
					description: "Short answers, get to the point",
				},
				{
					value: "some-context",
					label: "Some context is nice",
					description: "Normal explanations with some background",
				},
				{
					value: "all-details",
					label: "Give me all the details",
					description: "Thorough explanations, cover edge cases and rationale",
				},
			],
			adaptation: {
				brief: "Short answers. Get to the point. Minimal tangents.",
				"some-context": "Normal explanations with some background.",
				"all-details": "Thorough explanations. Cover edge cases and rationale.",
			},
		},
		teachingMode: {
			question: "How should your teacher guide you?",
			type: "single",
			options: [
				{ value: "simple", label: "Simple", description: "Focused explanations and fewer detours" },
				{ value: "immersive", label: "Immersive", description: "More questions, connections, and practice" },
			],
			adaptation: {
				simple: "Keep explanations concise and focus on the core lesson activity.",
				immersive: "Invite predictions, follow-up questions, connections, and short practice when useful.",
			},
		},
	},
	support: {
		issues: "https://github.com/your-org/your-school/issues",
	},
};

export default config;
