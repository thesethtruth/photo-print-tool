<script lang="ts">
	import { gridStore } from '$lib/stores/grid';
	import type { GridImage } from '$lib/stores/grid';
	import { RotateCw, X } from '@lucide/svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	interface Props {
		image: GridImage;
	}

	let { image }: Props = $props();

	let isDragging = $state(false);
	let startX = $state(0);
	let startY = $state(0);
	let startPosX = $state(0);
	let startPosY = $state(0);

	function handleMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;
		e.preventDefault();

		isDragging = true;
		startX = e.clientX;
		startY = e.clientY;
		startPosX = image.objectPosition[0];
		startPosY = image.objectPosition[1];

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;

		const deltaX = e.clientX - startX;
		const deltaY = e.clientY - startY;

		const sensitivityFactor = 0.5;
		const newX = Math.max(0, Math.min(100, startPosX + deltaX * sensitivityFactor));
		const newY = Math.max(0, Math.min(100, startPosY + deltaY * sensitivityFactor));

		gridStore.updateImagePosition(image.id, [newX, newY]);
	}

	function handleMouseUp() {
		isDragging = false;
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
	}

	function handleRotate(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		gridStore.rotateImage(image.id);
	}

	function handleRemove(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		gridStore.removeImage(image.id);
	}

	const settings = $derived($gridStore.settings);
</script>

<div
	class="card relative bg-white overflow-hidden group"
	style="padding: {settings.cardPadding}mm;"
>
	<div class="relative w-full h-full overflow-hidden bg-gray-100">
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<!-- svelte-ignore a11y_img_redundant_alt -->
		<img
			src={image.url}
			alt="Photo"
			class="w-full h-full object-cover {isDragging ? 'cursor-grabbing' : 'cursor-grab'}"
			style="
				object-position: {image.objectPosition[0]}% {image.objectPosition[1]}%;
				transform: rotate({image.rotation}deg);
			"
			onmousedown={handleMouseDown}
			draggable="false"
		/>

		<div
			class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-print"
			onmousedown={(e) => e.stopPropagation()}
		>
			<button
				type="button"
				class="w-8 h-8 rounded-md bg-secondary hover:bg-secondary/80 flex items-center justify-center shadow-sm cursor-pointer"
				onclick={handleRotate}
			>
				<RotateCw class="w-4 h-4" />
			</button>
			<button
				type="button"
				class="w-8 h-8 rounded-md bg-destructive hover:bg-destructive/90 text-white flex items-center justify-center shadow-sm cursor-pointer"
				onclick={handleRemove}
			>
				<X class="w-4 h-4" />
			</button>
		</div>
	</div>
</div>

<style>
	.card {
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
</style>
