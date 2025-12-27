<script lang="ts">
	import { Printer } from '@lucide/svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	function handlePrint() {
		window.print();
	}
</script>

<Button onclick={handlePrint} class="no-print">
	<Printer class="w-4 h-4 mr-2" />
	Print
</Button>
