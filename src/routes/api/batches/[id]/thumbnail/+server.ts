import type { RequestHandler } from './$types';
import { getBatchConfig } from '$lib/server/batches';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';
const BATCHES_DIR = path.join(DATA_DIR, 'batches');

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;

	try {
		const config = await getBatchConfig(id);

		if (!config || !config.images || config.images.length === 0) {
			return new Response('No images found', { status: 404 });
		}

		// Get the first image
		const firstImage = config.images[0];
		const imagePath = path.join(BATCHES_DIR, id, 'images', firstImage.filename);
		const imageBuffer = await fs.readFile(imagePath);

		// Determine content type from extension
		const ext = path.extname(firstImage.filename).toLowerCase();
		const contentTypeMap: Record<string, string> = {
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.gif': 'image/gif',
			'.webp': 'image/webp'
		};

		const contentType = contentTypeMap[ext] || 'image/jpeg';

		return new Response(imageBuffer, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000'
			}
		});
	} catch (err) {
		console.error('Error serving thumbnail:', err);
		return new Response('Thumbnail not found', { status: 404 });
	}
};
