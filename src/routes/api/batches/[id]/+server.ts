import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBatchConfig } from '$lib/server/batches';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;

	const config = await getBatchConfig(id);

	if (!config) {
		return json({ error: 'Batch not found' }, { status: 404 });
	}

	const imageUrls = config.images.map(
		(img) => `/api/batches/${id}/images/${img.filename}`
	);

	return json({
		config,
		images: imageUrls
	});
};
