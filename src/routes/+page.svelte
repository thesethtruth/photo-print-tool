<script lang="ts">
	import { gridStore } from "$lib/stores/grid";
	import GridPreview from "$lib/components/GridPreview.svelte";
	import DropZone from "$lib/components/DropZone.svelte";
	import GridSettings from "$lib/components/GridSettings.svelte";
	import PrintButton from "$lib/components/PrintButton.svelte";
	import SaveDialog from "$lib/components/SaveDialog.svelte";
	import BatchList from "$lib/components/BatchList.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Trash2, FolderOpen } from "@lucide/svelte";
	import type { BatchIndexEntry } from "$lib/server/batches";
	import { onMount } from "svelte";

	const state = $derived($gridStore);
	const hasImages = $derived(state.images.length > 0);

	let showClearDialog = $state(false);
	let showBatchesDialog = $state(false);
	let showDeleteDialog = $state(false);
	let batchToDelete = $state<string | null>(null);
	let recentBatches = $state<BatchIndexEntry[]>([]);
	let allBatches = $state<BatchIndexEntry[]>([]);

	function handleClearConfirm() {
		gridStore.reset();
		showClearDialog = false;
	}

	let batchListComponent: BatchList;

	function handleBatchSaved() {
		loadBatches();
	}

	async function loadBatches() {
		try {
			const response = await fetch("/api/batches");
			if (response.ok) {
				const batches = await response.json();
				batches.sort(
					(a: BatchIndexEntry, b: BatchIndexEntry) =>
						new Date(b.lastOpenedAt).getTime() -
						new Date(a.lastOpenedAt).getTime(),
				);
				allBatches = batches;
				recentBatches = batches.slice(0, 3);
			}
		} catch (err) {
			console.error("Failed to load batches:", err);
		}
	}

	async function handleLoadBatch(id: string) {
		if ($gridStore.isDirty) {
			const confirmed = confirm('You have unsaved changes. Do you want to discard them and load this batch?');
			if (!confirmed) return;
		}

		try {
			const response = await fetch(`/api/batches/${id}`);
			if (response.ok) {
				const data = await response.json();
				gridStore.loadBatch(data.config, data.images);
				gridStore.clearDirty();
				showBatchesDialog = false;
			}
		} catch (err) {
			console.error("Failed to load batch:", err);
		}
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}

	function handleDeleteClick(e: MouseEvent, id: string) {
		e.stopPropagation();
		batchToDelete = id;
		showDeleteDialog = true;
	}

	async function handleDeleteConfirm() {
		if (!batchToDelete) return;

		try {
			const response = await fetch(`/api/batches/${batchToDelete}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				showDeleteDialog = false;
				batchToDelete = null;
				await loadBatches();
			}
		} catch (err) {
			console.error('Failed to delete batch:', err);
		}
	}

	onMount(() => {
		loadBatches();

		// Track unsaved changes
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if ($gridStore.isDirty) {
				e.preventDefault();
				e.returnValue = '';
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	});
</script>

<div class="min-h-screen bg-gray-50 print:bg-white print:min-h-0">
	<div class="container mx-auto p-6 print:p-0 print:m-0 print:max-w-none">
		<header
			class="no-print flex items-center justify-between pb-6 mb-6 border-b"
		>
			<div>
				<h1 class="text-3xl font-bold text-gray-900 mb-2">
					Photo Print Grid Tool
				</h1>
				<p class="text-gray-600">
					Upload images, adjust positioning, and print them in a grid
					layout
				</p>
			</div>
			{#if hasImages}
				<Button
					variant="outline"
					onclick={() => (showClearDialog = true)}
				>
					<Trash2 class="w-4 h-4 mr-2" />
					Clear All
				</Button>
			{/if}
		</header>
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block print:gap-0">
			<div class="lg:col-span-2 space-y-6 print:space-y-0">
				{#if !hasImages}
					<div class="no-print">
						<DropZone />
					</div>
				{:else}
					<div class="no-print mb-4">
						<DropZone />
					</div>
					<GridPreview />
				{/if}
			</div>

			<div class="space-y-6 no-print">
				{#if hasImages}
					<div class="no-print space-y-4">
						<GridSettings />

						<div class="p-4 bg-white rounded-lg border space-y-3">
							<h3 class="font-semibold text-lg mb-3">Actions</h3>
							<div class="flex flex-col gap-2">
								<PrintButton />
								<SaveDialog onSave={handleBatchSaved} />
							</div>
							{#if state.batchId}
								<p class="text-xs text-muted-foreground mt-2">
									Current batch: {state.title}
								</p>
							{/if}
						</div>
					</div>
				{/if}

				<div class="p-4 bg-white rounded-lg border">
					<div class="flex items-center justify-between mb-4">
						<h3 class="font-semibold text-lg">Saved Batches</h3>
						{#if allBatches.length > 3}
							<Button
								variant="outline"
								size="sm"
								onclick={() => (showBatchesDialog = true)}
							>
								<FolderOpen class="w-4 h-4 mr-2" />
								View All
							</Button>
						{/if}
					</div>

					{#if recentBatches.length === 0}
						<div class="text-center py-8 text-muted-foreground">
							<FolderOpen
								class="w-12 h-12 mx-auto mb-2 opacity-50"
							/>
							<p>No saved batches yet</p>
						</div>
					{:else}
						<div class="space-y-2">
							{#each recentBatches as batch (batch.id)}
								<button
									onclick={() => handleLoadBatch(batch.id)}
									class="w-full text-left p-3 border rounded-lg hover:bg-accent hover:border-primary transition-colors"
								>
									<div class="font-medium">{batch.title}</div>
									<div class="text-sm text-muted-foreground">
										{formatDate(batch.createdAt)}
										{#if batch.printed}
											<span
												class="ml-2 text-xs text-primary"
												>• Printed</span
											>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<Dialog.Root
	open={showClearDialog}
	onOpenChange={(open) => (showClearDialog = open)}
>
	<Dialog.Content class="no-print">
		<Dialog.Header>
			<Dialog.Title>Clear All Images</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to clear all images and start over? This
				action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (showClearDialog = false)}
				>Cancel</Button
			>
			<Button variant="destructive" onclick={handleClearConfirm}
				>Clear All</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root
	open={showBatchesDialog}
	onOpenChange={(open) => (showBatchesDialog = open)}
>
	<Dialog.Content class="no-print max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>All Saved Batches</Dialog.Title>
			<Dialog.Description>Select a batch to load</Dialog.Description>
		</Dialog.Header>

		<div class="max-h-[500px] overflow-y-auto space-y-2 pr-2">
			{#each allBatches as batch (batch.id)}
				{@const thumbnailUrl = `/api/batches/${batch.id}/thumbnail`}
				<div class="relative group">
					<button
						onclick={() => handleLoadBatch(batch.id)}
						class="w-full text-left p-3 border rounded-lg hover:bg-accent hover:border-primary transition-colors flex gap-3 items-center"
					>
						<div
							class="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden flex items-center justify-center"
						>
							<img
								src={thumbnailUrl}
								alt="Thumbnail"
								class="w-full h-full object-cover"
								onerror={(e) => {
									e.currentTarget.style.display = "none";
								}}
							/>
							<FolderOpen class="w-8 h-8 text-gray-400 absolute" />
						</div>
						<div class="flex-1">
							<div class="font-medium">{batch.title}</div>
							<div class="text-sm text-muted-foreground">
								{formatDate(batch.createdAt)}
								{#if batch.printed}
									<span class="ml-2 text-xs text-primary"
										>• Printed</span
									>
								{/if}
							</div>
						</div>
					</button>
					<button
						type="button"
						onclick={(e) => handleDeleteClick(e, batch.id)}
						class="absolute top-3 right-3 w-8 h-8 rounded-md bg-destructive hover:bg-destructive/90 text-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
					>
						<Trash2 class="w-4 h-4" />
					</button>
				</div>
			{/each}
		</div>

		<Dialog.Footer>
			<Button
				variant="outline"
				onclick={() => (showBatchesDialog = false)}>Close</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root
	open={showDeleteDialog}
	onOpenChange={(open) => (showDeleteDialog = open)}
>
	<Dialog.Content class="no-print">
		<Dialog.Header>
			<Dialog.Title>Delete Batch</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete this batch? This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (showDeleteDialog = false)}
				>Cancel</Button
			>
			<Button variant="destructive" onclick={handleDeleteConfirm}
				>Delete</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
