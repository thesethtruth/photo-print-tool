import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getImagePath } from '$lib/server/batches';
import { promises as fs } from 'fs';

export const GET: RequestHandler = async ({ params }) => {
	const { id, filename } = params;

	try {
		const imagePath = await getImagePath(id, filename);
		const imageBuffer = await fs.readFile(imagePath);

		const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
		const mimeTypes: Record<string, string> = {
			jpg: 'image/jpeg',
			jpeg: 'image/jpeg',
			png: 'image/png',
			gif: 'image/gif',
			webp: 'image/webp'
		};

		const contentType = mimeTypes[ext] || 'image/jpeg';

		return new Response(imageBuffer, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	} catch (err) {
		console.error('Error serving image:', err);
		throw error(404, 'Image not found');
	}
};
