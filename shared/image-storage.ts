export interface CapturedImage {
	id: string;
	questIndex?: number;
	questName?: string;
	imageBlob: Blob;
	imageUrl?: string; // For display purposes
	timestamp: Date;
	location?: {
		latitude: number;
		longitude: number;
	};
	matchResult?: {
		confidence: "high" | "medium" | "low";
		locationIndex: number;
		status: "new" | "duplicate";
	};
	tags?: string[];
	notes?: string;
}

export interface ImageStorageStats {
	totalImages: number;
	totalSize: number; // in bytes
	oldestImage?: Date;
	newestImage?: Date;
}
