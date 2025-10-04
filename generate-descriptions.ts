import { OpenAI } from "openai";
import { quest } from "./shared/quest";
import fs from "fs/promises";
import path from "path";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

async function generateDescriptions() {
	const descriptions: Record<string, string> = {};

	for (const location of quest) {
		const firstImage = location.images[0];
		if (firstImage) {
			const imagePath = path.join(__dirname, "public", firstImage);
			try {
				const imageAsBase64 = await fs.readFile(imagePath, "base64");
				const response = await openai.chat.completions.create({
					model: "gpt-4o",
					messages: [
						{
							role: "user",
							content: [
								{
									type: "text",
									text: "Generate a detailed description of this location. Focus on unique, identifying features. This description will be used to match user-submitted photos.",
								},
								{
									type: "image_url",
									image_url: {
										url: `data:image/jpeg;base64,${imageAsBase64}`,
									},
								},
							],
						},
					],
				});

				const description = response.choices[0].message.content;
				if (description) {
					console.log(`Generated description for ${location.description}`);
					descriptions[location.description] = description;
				}
			} catch (error) {
				console.error(`Could not process image ${imagePath}:`, error);
			}
		}
	}

	await fs.writeFile(
		path.join(__dirname, "images.json"),
		JSON.stringify(descriptions, null, 2)
	);
	console.log("Descriptions saved to images.json");
}

generateDescriptions();
