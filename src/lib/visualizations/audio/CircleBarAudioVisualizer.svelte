<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import type { AudioProps } from './types';
	import { useAudio } from './audio.svelte';
	import Glow from '../core/Glow.svelte';
	import CircleBarVisualizer from '../core/CircleBarVisualizer.svelte';

	let props: AudioProps &
		Omit<ComponentProps<typeof CircleBarVisualizer>, 'values'> & { glow?: number } = $props();
	const audio = useAudio(() => props);
</script>

<Glow glow={props.glow ?? 0}>
	<CircleBarVisualizer {...props} values={audio.frame.values} />
</Glow>
