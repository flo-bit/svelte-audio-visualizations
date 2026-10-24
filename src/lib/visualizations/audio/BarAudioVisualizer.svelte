<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import type { AudioProps } from './types';
	import { useAudio } from './audio.svelte';
	import Glow from '../core/Glow.svelte';
	import BarVisualizer from '../core/BarVisualizer.svelte';

	let props: AudioProps & Omit<ComponentProps<typeof BarVisualizer>, 'values'> & { glow?: number } =
		$props();
	const audio = useAudio(() => props);
</script>

<Glow glow={props.glow ?? 0}>
	<BarVisualizer {...props} values={audio.frame.values} />
</Glow>
