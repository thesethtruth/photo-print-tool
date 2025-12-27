<script lang="ts">
	import { gridStore } from '$lib/stores/grid';

	const state = $derived($gridStore);
	const { settings } = $derived(state);

	function updateSetting(key: keyof typeof settings, value: number) {
		gridStore.updateSettings({ [key]: value });
	}
</script>

<div class="space-y-4 p-4 bg-white rounded-lg border">
	<h3 class="font-semibold text-lg mb-4">Grid Settings</h3>

	<div class="space-y-3">
		<div>
			<label for="cardWidth" class="block text-sm font-medium mb-1">
				Card Width (mm): {settings.cardWidth}
			</label>
			<input
				id="cardWidth"
				type="range"
				min="50"
				max="150"
				step="5"
				value={settings.cardWidth}
				oninput={(e) => updateSetting('cardWidth', Number(e.currentTarget.value))}
				class="w-full"
			/>
		</div>

		<div>
			<label for="cardHeight" class="block text-sm font-medium mb-1">
				Card Height (mm): {settings.cardHeight}
			</label>
			<input
				id="cardHeight"
				type="range"
				min="40"
				max="120"
				step="5"
				value={settings.cardHeight}
				oninput={(e) => updateSetting('cardHeight', Number(e.currentTarget.value))}
				class="w-full"
			/>
		</div>

		<div>
			<label for="cardPadding" class="block text-sm font-medium mb-1">
				Card Padding (mm): {settings.cardPadding}
			</label>
			<input
				id="cardPadding"
				type="range"
				min="0"
				max="15"
				step="1"
				value={settings.cardPadding}
				oninput={(e) => updateSetting('cardPadding', Number(e.currentTarget.value))}
				class="w-full"
			/>
		</div>

		<div>
			<label for="gap" class="block text-sm font-medium mb-1">
				Gap (mm): {settings.gap}
			</label>
			<input
				id="gap"
				type="range"
				min="0"
				max="20"
				step="1"
				value={settings.gap}
				oninput={(e) => updateSetting('gap', Number(e.currentTarget.value))}
				class="w-full"
			/>
		</div>

		<div>
			<label for="pageMargin" class="block text-sm font-medium mb-1">
				Page Margin (mm): {settings.pageMargin}
			</label>
			<input
				id="pageMargin"
				type="range"
				min="0"
				max="30"
				step="5"
				value={settings.pageMargin}
				oninput={(e) => updateSetting('pageMargin', Number(e.currentTarget.value))}
				class="w-full"
			/>
		</div>
	</div>
</div>

<style>
	input[type='range'] {
		accent-color: hsl(var(--primary));
	}
</style>
