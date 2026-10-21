export interface ProfileFieldOption {
	value: string;
	label: string;
	description?: string;
}

export interface ProfileField {
	question: string;
	type: "single" | "multi";
	options: ProfileFieldOption[];
	adaptation: Record<string, string>;
}

export interface SchoolConfig {
	publication?: {
		visibility?: "public" | "experimental";
		origin?: string;
		group?: string;
		prerequisites?: string;
		outcomes?: string;
	};
	chrome?: "island";
	name: string;
	publicName?: string;
	shortName?: string;
	description: string;
	adjectives: string[];
	nouns: string[];
	colors: string[];
	profileFields: Record<string, ProfileField>;
	support: {
		issues: string;
		community?: string;
	};
}
