<script lang="ts">
	import type { Snippet } from 'svelte';
	let { glow = 3, children }: { glow?: number; children: Snippet } = $props();
	const filterId = $props.id();
</script>

{#if glow > 0}
	<svg width="0" height="0" aria-hidden="true" style="position: absolute;">
		<filter id={filterId} y="-50%" x="-50%" width="200%" height="200%">
			<feGaussianBlur in="SourceGraphic" stdDeviation={glow} result="blurred" />
			<feColorMatrix type="saturate" in="blurred" values="5" />
			<feComposite in="SourceGraphic" operator="over" />
		</filter>
	</svg>
{/if}
<div style:filter={glow > 0 ? `url(#${filterId})` : undefined} style="height: 100%; width: 100%;">
	{@render children()}
</div>
