<script lang="ts">
	import { gridStore } from '$lib/stores/grid';
	import ImageCard from './ImageCard.svelte';
	import { onMount } from 'svelte';

	let containerEl: HTMLElement;
	let previewScale = $state(1);

	onMount(() => {
		const updateScale = () => {
			if (containerEl) {
				const containerWidth = containerEl.clientWidth;
				const a4WidthMm = 210;
				const mmToPx = 3.7795275591;
				const a4WidthPx = a4WidthMm * mmToPx;
				previewScale = Math.min(containerWidth / a4WidthPx, 1);
			}
		};

		updateScale();
		window.addEventListener('resize', updateScale);
		return () => window.removeEventListener('resize', updateScale);
	});

	const state = $derived($gridStore);
	const { settings, images } = $derived(state);

	const columnsPerPage = $derived(
		Math.floor((210 - settings.pageMargin * 2) / (settings.cardWidth + settings.gap))
	);
</script>

<div bind:this={containerEl} class="w-full overflow-auto no-print">
	<div
		class="grid-preview bg-white shadow-lg mx-auto"
		style="
			width: 210mm;
			min-height: 297mm;
			transform: scale({previewScale});
			transform-origin: top left;
		"
	>
		<div
			class="grid-container h-full"
			style="padding: {settings.pageMargin}mm;"
		>
			<div
				class="grid"
				style="
					display: grid;
					grid-template-columns: repeat({columnsPerPage}, {settings.cardWidth}mm);
					grid-auto-rows: {settings.cardHeight}mm;
					gap: {settings.gap}mm;
				"
			>
				{#each images as image (image.id)}
					<ImageCard {image} />
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	@media print {
		.grid-preview {
			transform: none !important;
		}
	}
</style>
