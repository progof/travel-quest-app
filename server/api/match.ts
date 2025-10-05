import { matchUserImage } from "../match-user-image";

export default defineEventHandler(async (event) => {
	if (event.method !== "POST") {
		throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
	}

	try {
		// Read multipart form data
		const formData = await readMultipartFormData(event);

		if (!formData || formData.length === 0) {
			throw createError({
				statusCode: 400,
				statusMessage: "No form data provided",
			});
		}

		return {
			location_index: 2,
			confidence: "high",
		};

		// Find the image file in the form data
		const imageFile = formData.find(
			(field) => field.name === "image" && field.filename && field.data
		);

		if (!imageFile) {
			throw createError({
				statusCode: 400,
				statusMessage: "No image file found in request",
			});
		}

		// Validate file type
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
		console.log(imageFile.type);
		if (!allowedTypes.includes(imageFile.type || "")) {
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid file type. Allowed: JPEG, PNG, WebP",
			});
		}

		// Validate file size (10MB limit)
		const maxSize = 10 * 1024 * 1024;
		if (imageFile.data.length > maxSize) {
			throw createError({
				statusCode: 400,
				statusMessage: "File too large. Maximum size: 10MB",
			});
		}

		// Convert to base64 for processing
		const mimeType = imageFile.type || "image/jpeg";
		const dataUrl = `data:${mimeType};base64,${imageFile.data.toString(
			"base64"
		)}`;

		const matchResult = await matchUserImage(dataUrl);
		return matchResult;
	} catch (error) {
		console.error("Error processing file upload:", error);

		if (error && typeof error === "object" && "statusCode" in error) {
			throw error; // Re-throw HTTP errors
		}

		throw createError({
			statusCode: 500,
			statusMessage: "Internal server error",
		});
	}
});
