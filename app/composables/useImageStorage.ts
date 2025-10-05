import { ref, computed } from "vue";
import type { CapturedImage, ImageStorageStats } from "#shared/image-storage";

const DB_NAME = "TravelQuestDB";
const DB_VERSION = 1;
const STORE_NAME = "capturedImages";

export const useImageStorage = () => {
	const isSupported = ref(false);
	const isLoading = ref(false);
	const error = ref<string | null>(null);

	// Check support on client side only
	if (
		process.client &&
		typeof window !== "undefined" &&
		"indexedDB" in window
	) {
		isSupported.value = true;
	}

	// Open IndexedDB connection
	const openDB = (): Promise<IDBDatabase> => {
		return new Promise((resolve, reject) => {
			if (!isSupported.value) {
				reject(new Error("IndexedDB is not supported"));
				return;
			}

			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Create object store if it doesn't exist
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });

					// Create indexes for efficient querying
					store.createIndex("timestamp", "timestamp");
					store.createIndex("questIndex", "questIndex");
					store.createIndex("questName", "questName");
				}
			};
		});
	};

	// Store a captured image
	const storeImage = async (
		imageData: Omit<CapturedImage, "id" | "timestamp">
	): Promise<string> => {
		isLoading.value = true;
		error.value = null;

		try {
			const db = await openDB();
			const transaction = db.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);

			// Generate unique ID and add timestamp
			const capturedImage: CapturedImage = {
				...imageData,
				id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
			};

			// Don't store object URL in IndexedDB as it won't persist
			// Object URLs will be created fresh when images are loaded

			const request = store.add(capturedImage);

			return new Promise((resolve, reject) => {
				request.onsuccess = () => resolve(capturedImage.id);
				request.onerror = () => reject(request.error);

				transaction.oncomplete = () => {
					db.close();
					isLoading.value = false;
				};
			});
		} catch (err) {
			isLoading.value = false;
			error.value =
				err instanceof Error ? err.message : "Failed to store image";
			throw err;
		}
	};

	// Retrieve all images
	const getAllImages = async (): Promise<CapturedImage[]> => {
		isLoading.value = true;
		error.value = null;

		try {
			const db = await openDB();
			const transaction = db.transaction([STORE_NAME], "readonly");
			const store = transaction.objectStore(STORE_NAME);
			const request = store.getAll();

			return new Promise((resolve, reject) => {
				request.onsuccess = () => {
					const images = request.result;
					// Don't create object URLs here - let the component handle it
					// This avoids URL lifecycle issues
					resolve(images);
				};
				request.onerror = () => reject(request.error);

				transaction.oncomplete = () => {
					db.close();
					isLoading.value = false;
				};
			});
		} catch (err) {
			isLoading.value = false;
			error.value =
				err instanceof Error ? err.message : "Failed to retrieve images";
			throw err;
		}
	};

	// Get image by ID
	const getImageById = async (id: string): Promise<CapturedImage | null> => {
		try {
			const db = await openDB();
			const transaction = db.transaction([STORE_NAME], "readonly");
			const store = transaction.objectStore(STORE_NAME);
			const request = store.get(id);

			return new Promise((resolve, reject) => {
				request.onsuccess = () => {
					const image = request.result;
					// Don't create object URLs here - let the component handle it
					resolve(image || null);
				};
				request.onerror = () => reject(request.error);
				transaction.oncomplete = () => db.close();
			});
		} catch (err) {
			error.value = err instanceof Error ? err.message : "Failed to get image";
			return null;
		}
	};

	// Get images by quest
	const getImagesByQuest = async (
		questIndex: number
	): Promise<CapturedImage[]> => {
		try {
			const db = await openDB();
			const transaction = db.transaction([STORE_NAME], "readonly");
			const store = transaction.objectStore(STORE_NAME);
			const index = store.index("questIndex");
			const request = index.getAll(questIndex);

			return new Promise((resolve, reject) => {
				request.onsuccess = () => {
					const images = request.result;
					// Don't create object URLs here - let the component handle it
					resolve(images);
				};
				request.onerror = () => reject(request.error);
				transaction.oncomplete = () => db.close();
			});
		} catch (err) {
			error.value =
				err instanceof Error ? err.message : "Failed to get quest images";
			return [];
		}
	};

	// Delete image by ID
	const deleteImage = async (id: string): Promise<boolean> => {
		try {
			const db = await openDB();
			const transaction = db.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);

			// First get the image to revoke its object URL
			const getRequest = store.get(id);
			getRequest.onsuccess = () => {
				const image = getRequest.result;
				if (image?.imageUrl) {
					URL.revokeObjectURL(image.imageUrl);
				}
			};

			const deleteRequest = store.delete(id);

			return new Promise((resolve, reject) => {
				deleteRequest.onsuccess = () => resolve(true);
				deleteRequest.onerror = () => reject(deleteRequest.error);
				transaction.oncomplete = () => db.close();
			});
		} catch (err) {
			error.value =
				err instanceof Error ? err.message : "Failed to delete image";
			return false;
		}
	};

	// Get storage statistics
	const getStorageStats = async (): Promise<ImageStorageStats> => {
		try {
			const images = await getAllImages();

			const stats: ImageStorageStats = {
				totalImages: images.length,
				totalSize: images.reduce(
					(sum, img) => sum + (img.imageBlob?.size || 0),
					0
				),
				oldestImage:
					images.length > 0
						? new Date(
								Math.min(
									...images.map((img) => new Date(img.timestamp).getTime())
								)
						  )
						: undefined,
				newestImage:
					images.length > 0
						? new Date(
								Math.max(
									...images.map((img) => new Date(img.timestamp).getTime())
								)
						  )
						: undefined,
			};

			return stats;
		} catch (err) {
			return {
				totalImages: 0,
				totalSize: 0,
			};
		}
	};

	// Clear all images (for cleanup)
	const clearAllImages = async (): Promise<boolean> => {
		try {
			// First revoke all object URLs
			const images = await getAllImages();
			images.forEach((img) => {
				if (img.imageUrl) {
					URL.revokeObjectURL(img.imageUrl);
				}
			});

			const db = await openDB();
			const transaction = db.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);
			const request = store.clear();

			return new Promise((resolve, reject) => {
				request.onsuccess = () => resolve(true);
				request.onerror = () => reject(request.error);
				transaction.oncomplete = () => db.close();
			});
		} catch (err) {
			error.value =
				err instanceof Error ? err.message : "Failed to clear images";
			return false;
		}
	};

	return {
		// State
		isSupported: computed(() => isSupported.value),
		isLoading: computed(() => isLoading.value),
		error: computed(() => error.value),

		// Methods
		storeImage,
		getAllImages,
		getImageById,
		getImagesByQuest,
		deleteImage,
		getStorageStats,
		clearAllImages,
	};
};
