<script lang="ts">
	import { gridStore } from '$lib/stores/grid';
	import * as Slider from '$lib/components/ui/slider';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Plus, Trash2 } from '@lucide/svelte';

	const state = $derived($gridStore);
	const { settings, presets } = $derived(state);

	let showSavePresetDialog = $state(false);
	let presetName = $state('');
	let selectedPreset = $state('');

	function updateSetting(key: keyof typeof settings, value: number) {
		gridStore.updateSettings({ [key]: value });
		gridStore.markDirty();
	}

	function handlePresetChange(event: Event) {
		const value = (event.target as HTMLSelectElement).value;
		if (value) {
			selectedPreset = value;
			gridStore.applyPreset(value);
			gridStore.markDirty();
		}
	}

	function handleSavePreset() {
		if (presetName.trim()) {
			gridStore.saveAsPreset(presetName.trim());
			presetName = '';
			showSavePresetDialog = false;
		}
	}

	function handleDeletePreset(name: string) {
		if (confirm(`Delete preset "${name}"?`)) {
			gridStore.deletePreset(name);
			if (selectedPreset === name) {
				selectedPreset = '';
			}
		}
	}

	const customPresets = $derived(presets.slice(4));
</script>

<div class="space-y-4 p-4 bg-white rounded-lg border">
	<h3 class="font-semibold text-lg mb-4">Grid Settings</h3>

	<div class="space-y-2">
		<label class="block text-sm font-medium">Preset</label>
		<div class="flex gap-2">
			<select
				class="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
				value={selectedPreset}
				onchange={handlePresetChange}
			>
				<option value="">Custom</option>
				{#each presets as preset}
					<option value={preset.name}>{preset.name}</option>
				{/each}
			</select>
			<Button
				size="sm"
				variant="outline"
				onclick={() => (showSavePresetDialog = true)}
			>
				<Plus class="w-4 h-4" />
			</Button>
		</div>
		{#if customPresets.length > 0}
			<div class="space-y-1 mt-2">
				{#each customPresets as preset}
					<div class="flex items-center justify-between text-xs text-muted-foreground px-2">
						<span>{preset.name}</span>
						<button
							type="button"
							onclick={() => handleDeletePreset(preset.name)}
							class="hover:text-destructive transition-colors"
						>
							<Trash2 class="w-3 h-3" />
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="space-y-3">
		<div>
			<label class="block text-sm font-medium mb-2">
				Card Width (mm): {settings.cardWidth}
			</label>
			<Slider.Root
				min={50}
				max={150}
				step={5}
				value={[settings.cardWidth]}
				onValueChange={(v) => updateSetting('cardWidth', v[0])}
			/>
		</div>

		<div>
			<label class="block text-sm font-medium mb-2">
				Card Height (mm): {settings.cardHeight}
			</label>
			<Slider.Root
				min={40}
				max={120}
				step={5}
				value={[settings.cardHeight]}
				onValueChange={(v) => updateSetting('cardHeight', v[0])}
			/>
		</div>

		<div>
			<label class="block text-sm font-medium mb-2">
				Card Padding (mm): {settings.cardPadding}
			</label>
			<Slider.Root
				min={0}
				max={15}
				step={1}
				value={[settings.cardPadding]}
				onValueChange={(v) => updateSetting('cardPadding', v[0])}
			/>
		</div>

		<div>
			<label class="block text-sm font-medium mb-2">
				Gap (mm): {settings.gap}
			</label>
			<Slider.Root
				min={0}
				max={20}
				step={1}
				value={[settings.gap]}
				onValueChange={(v) => updateSetting('gap', v[0])}
			/>
		</div>

		<div>
			<label class="block text-sm font-medium mb-2">
				Page Margin (mm): {settings.pageMargin}
			</label>
			<Slider.Root
				min={0}
				max={30}
				step={5}
				value={[settings.pageMargin]}
				onValueChange={(v) => updateSetting('pageMargin', v[0])}
			/>
		</div>
	</div>
</div>

<Dialog.Root
	open={showSavePresetDialog}
	onOpenChange={(open) => (showSavePresetDialog = open)}
>
	<Dialog.Content class="no-print">
		<Dialog.Header>
			<Dialog.Title>Save Preset</Dialog.Title>
			<Dialog.Description>
				Save the current grid settings as a preset for quick access later.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-4">
			<div>
				<label class="block text-sm font-medium mb-2">Preset Name</label>
				<input
					type="text"
					class="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
					placeholder="My Custom Preset"
					bind:value={presetName}
					onkeydown={(e) => {
						if (e.key === 'Enter') handleSavePreset();
					}}
				/>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (showSavePresetDialog = false)}
				>Cancel</Button
			>
			<Button onclick={handleSavePreset} disabled={!presetName.trim()}
				>Save Preset</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
