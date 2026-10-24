<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import type { AudioProps } from './types';
	import { useAudio } from './audio.svelte';
	import Glow from '../core/Glow.svelte';
	import MicrophoneVisualizer from '../core/MicrophoneVisualizer.svelte';

	let props: AudioProps &
		Omit<ComponentProps<typeof MicrophoneVisualizer>, 'value'> & { glow?: number } = $props();
	const audio = useAudio(() => props);
</script>

<Glow glow={props.glow ?? 0}>
	<MicrophoneVisualizer {...props} value={audio.frame.level} />
</Glow>
