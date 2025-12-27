import { writable } from 'svelte/store';
import type { GridSettings, ImageConfig } from '$lib/server/batches';

export interface GridImage {
	id: string;
	file: File | null;
	url: string;
	filename: string;
	objectPosition: [number, number];
	rotation: number;
}

export interface GridState {
	settings: GridSettings;
	images: GridImage[];
	title: string;
	batchId: string | null;
}

const defaultSettings: GridSettings = {
	cardWidth: 90,
	cardHeight: 60,
	cardPadding: 5,
	gap: 5,
	pageMargin: 10
};

const initialState: GridState = {
	settings: defaultSettings,
	images: [],
	title: '',
	batchId: null
};

function createGridStore() {
	const { subscribe, set, update } = writable<GridState>(initialState);

	return {
		subscribe,
		set,
		update,

		addImages: (files: File[]) => {
			update((state) => {
				const newImages: GridImage[] = files.map((file, index) => ({
					id: `${Date.now()}-${index}`,
					file,
					url: URL.createObjectURL(file),
					filename: file.name,
					objectPosition: [50, 50] as [number, number],
					rotation: 0
				}));
				return {
					...state,
					images: [...state.images, ...newImages]
				};
			});
		},

		removeImage: (id: string) => {
			update((state) => {
				const image = state.images.find((img) => img.id === id);
				if (image?.url && image.file) {
					URL.revokeObjectURL(image.url);
				}
				return {
					...state,
					images: state.images.filter((img) => img.id !== id)
				};
			});
		},

		updateImagePosition: (id: string, position: [number, number]) => {
			update((state) => ({
				...state,
				images: state.images.map((img) =>
					img.id === id ? { ...img, objectPosition: position } : img
				)
			}));
		},

		rotateImage: (id: string) => {
			update((state) => ({
				...state,
				images: state.images.map((img) =>
					img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
				)
			}));
		},

		reorderImages: (fromIndex: number, toIndex: number) => {
			update((state) => {
				const newImages = [...state.images];
				const [removed] = newImages.splice(fromIndex, 1);
				newImages.splice(toIndex, 0, removed);
				return {
					...state,
					images: newImages
				};
			});
		},

		updateSettings: (settings: Partial<GridSettings>) => {
			update((state) => ({
				...state,
				settings: { ...state.settings, ...settings }
			}));
		},

		setTitle: (title: string) => {
			update((state) => ({ ...state, title }));
		},

		setBatchId: (batchId: string | null) => {
			update((state) => ({ ...state, batchId }));
		},

		loadBatch: (
			config: {
				id: string;
				title: string;
				grid: GridSettings;
				images: ImageConfig[];
			},
			imageUrls: string[]
		) => {
			update((state) => {
				state.images.forEach((img) => {
					if (img.url && img.file) {
						URL.revokeObjectURL(img.url);
					}
				});

				const newImages: GridImage[] = config.images.map((imgConfig, index) => ({
					id: `loaded-${Date.now()}-${index}`,
					file: null,
					url: imageUrls[index],
					filename: imgConfig.filename,
					objectPosition: imgConfig.objectPosition,
					rotation: imgConfig.rotation
				}));

				return {
					settings: config.grid,
					images: newImages,
					title: config.title,
					batchId: config.id
				};
			});
		},

		reset: () => {
			update((state) => {
				state.images.forEach((img) => {
					if (img.url && img.file) {
						URL.revokeObjectURL(img.url);
					}
				});
				return {
					settings: { ...defaultSettings },
					images: [],
					title: '',
					batchId: null
				};
			});
		}
	};
}

export const gridStore = createGridStore();
