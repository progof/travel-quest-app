import { OpenAI } from "openai";
import { readFile, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { questLocations } from "#shared/quest";

const openai = new OpenAI({
	apiKey:
		"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",
});

// const UPLOADED_IMAGE_IDS_PATH = "./images.json";
// const uploadedImageIds = JSON.parse(
// 	await readFile(UPLOADED_IMAGE_IDS_PATH, "utf-8")
// ) as Record<string, string>;

// async function ensureFileId(filePath: string) {
// 	if (filePath in uploadedImageIds) {
// 		return uploadedImageIds[filePath];
// 	}
// 	const fileContent = createReadStream(path.resolve("public", filePath));
// 	const result = await openai.files.create({
// 		file: fileContent,
// 		purpose: "vision",
// 	});
// 	uploadedImageIds[filePath] = result.id;
// 	await writeFile(
// 		UPLOADED_IMAGE_IDS_PATH,
// 		JSON.stringify(uploadedImageIds, null, 2)
// 	);

// 	return result.id;
// }

interface LocationFile {
	fileId: string;
	locationDescription: string;
	imagePath: string;
}

interface QuestMatcherConfig {
	locationFiles: LocationFile[];
	createdAt: string;
	apiVersion: string;
}

interface MatchResult {
	success: boolean;
	matchedLocation?: string;
	confidence?: "high" | "medium" | "low";
	error?: string;
}

export async function matchUserImage(base64File: string) {
	const locations = questLocations.map((location) => ({
		name: location.name,
		description: location.description,
	}));

	const response = await openai.responses.create({
		model: "gpt-4o-mini",
		input: [
			{
				role: "system",
				content: [
					{
						type: "input_text",
						text:
							`You are an expert at analyzing and matching travel quest location images. Respond ONLY with structured JSON indicating whether the user's image matches any of the reference locations.

							STRICT MATCHING POLICY:
							- Only mark a location as matched if the user's image FULLY and CLEARLY depicts the exact same physical location, object, or scene as one of the reference quest locations.
							- Do NOT accept images that are merely nearby, similar, or show a related area. The match must be unmistakable and all key features must align.
							- Reject partial, approximate, or ambiguous matches. If there is any doubt, return -1 for no match.
							- The user's image must show the same main subject, from a similar angle and perspective, with matching distinctive features, context, and environment.
							- Ignore images that are close but do not fully fit ALL criteria.

							Look for:
							- Identical landmarks, buildings, or distinctive architectural features
							- Matching viewing angles, perspectives, and compositions
							- The same environmental context, lighting, and setting
							- Recognizable signage, decorations, or unique elements that are clearly present in both images
							- The same objects, people, or activities in the scene

							REFERENCE QUEST LOCATION DESCRIPTIONS TO COMPARE AGAINST:` +
							locations
								.map((loc, index) => {
									return `Index - ${index}. ${loc.name} - ${loc.description}`;
								})
								.join(","),
					},
				],
			},
			{
				role: "user",
				content: [
					{
						type: "input_text",
						text: "USER'S IMAGE TO ANALYZE:",
					},
					{
						type: "input_image",
						detail: "low",
						image_url: base64File,
					},
				],
			},
		],
		text: {
			format: zodTextFormat(
				z.object({
					location_index: z
						.number()
						.describe("Index of the matched location, or -1 if no match"),
					confidence: z
						.enum(["high", "medium", "low"])
						.describe("Confidence level of the match"),
				}),
				"location_match_result"
			),
		},
		temperature: 0.1,
		max_output_tokens: 100,
	});

	return JSON.parse(response.output_text) as {
		location_index: number;
		confidence: "high" | "medium" | "low";
	};
}

// console.time("matchUserImage");
// await matchUserImage(path.resolve("./public/images/registration-lemur/2.jpg"));
// console.timeEnd("matchUserImage");
