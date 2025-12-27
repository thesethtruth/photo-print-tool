<script lang="ts">
	import { gridStore } from '$lib/stores/grid';
	import { Upload } from '@lucide/svelte';

	let isDragging = $state(false);
	let fileInput: HTMLInputElement;

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		const files = Array.from(e.dataTransfer?.files || []).filter((file) =>
			file.type.startsWith('image/')
		);

		if (files.length > 0) {
			gridStore.addImages(files);
		}
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const files = Array.from(target.files || []);

		if (files.length > 0) {
			gridStore.addImages(files);
		}

		target.value = '';
	}

	function openFilePicker() {
		fileInput.click();
	}
</script>

<div
	class="border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer {isDragging
		? 'border-primary bg-primary/5'
		: 'border-gray-300 hover:border-gray-400'}"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	onclick={openFilePicker}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Enter' && openFilePicker()}
>
	<Upload class="w-12 h-12 mx-auto mb-4 text-gray-400" />
	<p class="text-lg font-medium text-gray-700 mb-2">Drop images here</p>
	<p class="text-sm text-gray-500">or click to browse</p>
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		multiple
		class="hidden"
		onchange={handleFileSelect}
	/>
</div>
