<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { AudioFrame, AudioProps } from './types';
	import { useAudio } from './audio.svelte';

	let props: AudioProps & { children: Snippet<[AudioFrame]> } = $props();
	const audio = useAudio(() => props);
</script>

{@render props.children(audio.frame)}
