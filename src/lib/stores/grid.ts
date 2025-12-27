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

export interface GridPreset {
	name: string;
	settings: GridSettings;
}

export interface GridState {
	settings: GridSettings;
	images: GridImage[];
	title: string;
	batchId: string | null;
	isDirty: boolean;
	presets: GridPreset[];
}

const defaultSettings: GridSettings = {
	cardWidth: 90,
	cardHeight: 60,
	cardPadding: 5,
	gap: 5,
	pageMargin: 10
};

const defaultPresets: GridPreset[] = [
	{
		name: 'Default (90×60mm)',
		settings: { cardWidth: 90, cardHeight: 60, cardPadding: 5, gap: 5, pageMargin: 10 }
	},
	{
		name: 'Polaroid Style (88×107mm)',
		settings: { cardWidth: 88, cardHeight: 107, cardPadding: 8, gap: 5, pageMargin: 10 }
	},
	{
		name: 'Square Cards (80×80mm)',
		settings: { cardWidth: 80, cardHeight: 80, cardPadding: 5, gap: 5, pageMargin: 10 }
	},
	{
		name: 'Compact (60×40mm)',
		settings: { cardWidth: 60, cardHeight: 40, cardPadding: 3, gap: 3, pageMargin: 10 }
	}
];

function loadPresetsFromStorage(): GridPreset[] {
	if (typeof window === 'undefined') return [...defaultPresets];
	try {
		const saved = localStorage.getItem('gridPresets');
		if (saved) {
			const custom = JSON.parse(saved) as GridPreset[];
			return [...defaultPresets, ...custom];
		}
	} catch (e) {
		console.error('Failed to load presets:', e);
	}
	return [...defaultPresets];
}

function saveCustomPresetsToStorage(presets: GridPreset[]): void {
	if (typeof window === 'undefined') return;
	try {
		const customPresets = presets.slice(defaultPresets.length);
		localStorage.setItem('gridPresets', JSON.stringify(customPresets));
	} catch (e) {
		console.error('Failed to save presets:', e);
	}
}

const initialState: GridState = {
	settings: defaultSettings,
	images: [],
	title: '',
	batchId: null,
	isDirty: false,
	presets: loadPresetsFromStorage()
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
					batchId: null,
					isDirty: false
				};
			});
		},

		markDirty: () => {
			update((state) => ({ ...state, isDirty: true }));
		},

		clearDirty: () => {
			update((state) => ({ ...state, isDirty: false }));
		},

		applyPreset: (presetName: string) => {
			update((state) => {
				const preset = state.presets.find((p) => p.name === presetName);
				if (preset) {
					return {
						...state,
						settings: { ...preset.settings }
					};
				}
				return state;
			});
		},

		saveAsPreset: (name: string) => {
			update((state) => {
				const newPreset: GridPreset = {
					name,
					settings: { ...state.settings }
				};
				const newPresets = [...state.presets, newPreset];
				saveCustomPresetsToStorage(newPresets);
				return {
					...state,
					presets: newPresets
				};
			});
		},

		deletePreset: (name: string) => {
			update((state) => {
				const isDefault = defaultPresets.some((p) => p.name === name);
				if (isDefault) return state;

				const newPresets = state.presets.filter((p) => p.name !== name);
				saveCustomPresetsToStorage(newPresets);
				return {
					...state,
					presets: newPresets
				};
			});
		}
	};
}

export const gridStore = createGridStore();
