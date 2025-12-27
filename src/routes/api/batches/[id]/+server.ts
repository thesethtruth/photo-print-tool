import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBatchConfig, deleteBatch, updateLastOpenedAt } from '$lib/server/batches';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;

	const config = await getBatchConfig(id);

	if (!config) {
		return json({ error: 'Batch not found' }, { status: 404 });
	}

	// Update lastOpenedAt timestamp
	await updateLastOpenedAt(id);

	const imageUrls = config.images.map(
		(img) => `/api/batches/${id}/images/${img.filename}`
	);

	return json({
		config,
		images: imageUrls
	});
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { id } = params;

	try {
		await deleteBatch(id);
		return json({ success: true });
	} catch (err) {
		console.error('Error deleting batch:', err);
		return json({ error: 'Failed to delete batch' }, { status: 500 });
	}
};
