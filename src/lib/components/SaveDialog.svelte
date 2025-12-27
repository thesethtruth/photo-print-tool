<script lang="ts">
	import { gridStore } from '$lib/stores/grid';
	import { Save } from '@lucide/svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';

	interface Props {
		onSave?: () => void;
	}

	let { onSave }: Props = $props();

	let isOpen = $state(false);
	let title = $state('');
	let isSaving = $state(false);
	let error = $state('');

	const state = $derived($gridStore);
	const canSave = $derived(state.images.length > 0);

	function handleOpenChange(open: boolean) {
		if (open && canSave) {
			title = state.title || '';
			error = '';
		}
		isOpen = open;
	}

	async function handleSave() {
		if (!title.trim()) {
			error = 'Please enter a title';
			return;
		}

		isSaving = true;
		error = '';

		try {
			const formData = new FormData();

			const config = {
				title: title.trim(),
				grid: state.settings,
				images: state.images.map((img) => ({
					objectPosition: img.objectPosition,
					rotation: img.rotation
				}))
			};

			formData.append('config', JSON.stringify(config));

			for (const image of state.images) {
				if (image.file) {
					formData.append('images', image.file);
				}
			}

			const response = await fetch('/api/batches', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('Failed to save batch');
			}

			const result = await response.json();
			gridStore.setBatchId(result.id);
			gridStore.setTitle(title.trim());

			isOpen = false;
			onSave?.();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save batch';
		} finally {
			isSaving = false;
		}
	}
</script>

<Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
	<Dialog.Trigger class="no-print">
		<Button disabled={!canSave}>
			<Save class="w-4 h-4 mr-2" />
			Save Batch
		</Button>
	</Dialog.Trigger>
	<Dialog.Content class="no-print">
		<Dialog.Header>
			<Dialog.Title>Save Batch</Dialog.Title>
			<Dialog.Description>
				Enter a title for this batch to save your images and settings.
			</Dialog.Description>
		</Dialog.Header>

		<div class="mb-4">
			<label for="batch-title" class="block text-sm font-medium mb-2">
				Batch Title
			</label>
			<input
				id="batch-title"
				type="text"
				bind:value={title}
				placeholder="Enter a title for this batch"
				class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
				disabled={isSaving}
				onkeydown={(e) => e.key === 'Enter' && handleSave()}
			/>
		</div>

		{#if error}
			<p class="text-sm text-destructive mb-4">{error}</p>
		{/if}

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (isOpen = false)} disabled={isSaving}>
				Cancel
			</Button>
			<Button onclick={handleSave} disabled={isSaving}>
				{isSaving ? 'Saving...' : 'Save'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
