<script lang="ts">
	import { gridStore } from '$lib/stores/grid';
	import { FolderOpen } from '@lucide/svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { BatchIndexEntry } from '$lib/server/batches';
	import { onMount } from 'svelte';

	let batches = $state<BatchIndexEntry[]>([]);
	let isLoading = $state(false);
	let error = $state('');

	onMount(() => {
		loadBatches();
	});

	async function loadBatches() {
		isLoading = true;
		error = '';

		try {
			const response = await fetch('/api/batches');
			if (!response.ok) {
				throw new Error('Failed to load batches');
			}

			batches = await response.json();
			batches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load batches';
		} finally {
			isLoading = false;
		}
	}

	async function handleLoadBatch(id: string) {
		isLoading = true;
		error = '';

		try {
			const response = await fetch(`/api/batches/${id}`);
			if (!response.ok) {
				throw new Error('Failed to load batch');
			}

			const data = await response.json();
			gridStore.loadBatch(data.config, data.images);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load batch';
		} finally {
			isLoading = false;
		}
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="space-y-4 no-print">
	<div class="flex items-center justify-between">
		<h3 class="font-semibold text-lg">Saved Batches</h3>
		<Button variant="outline" size="sm" onclick={loadBatches} disabled={isLoading}>
			Refresh
		</Button>
	</div>

	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}

	{#if isLoading}
		<p class="text-sm text-muted-foreground">Loading...</p>
	{:else if batches.length === 0}
		<div class="text-center py-8 text-muted-foreground">
			<FolderOpen class="w-12 h-12 mx-auto mb-2 opacity-50" />
			<p>No saved batches yet</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each batches as batch (batch.id)}
				<button
					onclick={() => handleLoadBatch(batch.id)}
					disabled={isLoading}
					class="w-full text-left p-3 border rounded-lg hover:bg-accent hover:border-primary transition-colors disabled:opacity-50"
				>
					<div class="font-medium">{batch.title}</div>
					<div class="text-sm text-muted-foreground">
						{formatDate(batch.createdAt)}
						{#if batch.printed}
							<span class="ml-2 text-xs text-primary">• Printed</span>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
