import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getIndex,
	saveBatch,
	generateBatchId,
	type BatchConfig
} from '$lib/server/batches';

export const GET: RequestHandler = async () => {
	const index = await getIndex();
	const batches = Array.from(index.values());
	return json(batches);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const configJson = formData.get('config') as string;

		if (!configJson) {
			return json({ error: 'Missing config' }, { status: 400 });
		}

		const config = JSON.parse(configJson);
		const batchId = generateBatchId();

		const images: { filename: string; buffer: Buffer }[] = [];
		const imageFiles = formData.getAll('images') as File[];

		for (let i = 0; i < imageFiles.length; i++) {
			const file = imageFiles[i];
			const arrayBuffer = await file.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			const ext = file.name.split('.').pop() || 'jpg';
			const filename = `${String(i + 1).padStart(3, '0')}.${ext}`;

			images.push({ filename, buffer });
		}

		const batchConfig: BatchConfig = {
			id: batchId,
			title: config.title || 'Untitled',
			createdAt: new Date().toISOString(),
			printed: false,
			grid: config.grid,
			images: images.map((img, index) => ({
				filename: img.filename,
				objectPosition: config.images[index]?.objectPosition || [50, 50],
				rotation: config.images[index]?.rotation || 0
			}))
		};

		await saveBatch(batchConfig, images);

		return json({ id: batchId }, { status: 201 });
	} catch (error) {
		console.error('Error saving batch:', error);
		return json({ error: 'Failed to save batch' }, { status: 500 });
	}
};
