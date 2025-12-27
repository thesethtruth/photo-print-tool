import { promises as fs } from 'fs';
import path from 'path';

export interface BatchIndexEntry {
	id: string;
	title: string;
	createdAt: string;
	printed: boolean;
}

export interface GridSettings {
	cardWidth: number;
	cardHeight: number;
	cardPadding: number;
	gap: number;
	pageMargin: number;
}

export interface ImageConfig {
	filename: string;
	objectPosition: [number, number];
	rotation: number;
}

export interface BatchConfig {
	id: string;
	title: string;
	createdAt: string;
	printed: boolean;
	grid: GridSettings;
	images: ImageConfig[];
}

const DATA_DIR = process.env.DATA_DIR || './data';
const BATCHES_DIR = path.join(DATA_DIR, 'batches');

let index: Map<string, BatchIndexEntry> | null = null;

export async function getIndex(): Promise<Map<string, BatchIndexEntry>> {
	if (index) return index;
	index = await buildIndexFromDisk();
	return index;
}

async function buildIndexFromDisk(): Promise<Map<string, BatchIndexEntry>> {
	const indexMap = new Map<string, BatchIndexEntry>();

	try {
		await fs.mkdir(BATCHES_DIR, { recursive: true });
		const batchDirs = await fs.readdir(BATCHES_DIR);

		for (const batchId of batchDirs) {
			const configPath = path.join(BATCHES_DIR, batchId, 'config.json');
			try {
				const configContent = await fs.readFile(configPath, 'utf-8');
				const config: BatchConfig = JSON.parse(configContent);
				indexMap.set(config.id, {
					id: config.id,
					title: config.title,
					createdAt: config.createdAt,
					printed: config.printed
				});
			} catch (err) {
				console.error(`Error reading config for batch ${batchId}:`, err);
			}
		}
	} catch (err) {
		console.error('Error building index from disk:', err);
	}

	return indexMap;
}

export function addToIndex(entry: BatchIndexEntry): void {
	index?.set(entry.id, entry);
}

export async function getBatchConfig(id: string): Promise<BatchConfig | null> {
	const configPath = path.join(BATCHES_DIR, id, 'config.json');
	try {
		const configContent = await fs.readFile(configPath, 'utf-8');
		return JSON.parse(configContent);
	} catch (err) {
		console.error(`Error reading batch config ${id}:`, err);
		return null;
	}
}

export async function saveBatch(
	config: BatchConfig,
	images: { filename: string; buffer: Buffer }[]
): Promise<void> {
	const batchDir = path.join(BATCHES_DIR, config.id);
	const imagesDir = path.join(batchDir, 'images');

	await fs.mkdir(imagesDir, { recursive: true });

	for (const image of images) {
		const imagePath = path.join(imagesDir, image.filename);
		await fs.writeFile(imagePath, image.buffer);
	}

	const configPath = path.join(batchDir, 'config.json');
	await fs.writeFile(configPath, JSON.stringify(config, null, 2));

	addToIndex({
		id: config.id,
		title: config.title,
		createdAt: config.createdAt,
		printed: config.printed
	});
}

export async function getImagePath(batchId: string, filename: string): Promise<string> {
	return path.join(BATCHES_DIR, batchId, 'images', filename);
}

export function generateBatchId(): string {
	const now = new Date();
	const dateStr = now.toISOString().split('T')[0];
	const randomStr = Math.random().toString(36).substring(2, 8);
	return `${dateStr}-${randomStr}`;
}
