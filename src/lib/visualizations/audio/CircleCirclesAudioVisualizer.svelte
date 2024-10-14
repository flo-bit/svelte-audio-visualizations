<script lang="ts">
	import type { WavRecorder, AudioFilePlayer, WavStreamPlayer } from '$lib/visualizations/wavtools';
	import AudioFrequency from './AudioFrequency.svelte';
	import Glow from '../core/Glow.svelte';
	import CircleCirclesVisualizer from '../core/CircleCirclesVisualizer.svelte';

	export let audio: AudioFilePlayer | WavRecorder | WavStreamPlayer | null;
	export let glow: number | undefined = 3;
	export let detail: number | undefined = 50;
</script>

<AudioFrequency {audio} let:getValues>
	<Glow {glow}>
		<CircleCirclesVisualizer values={getValues(detail || 50)} {...$$restProps} />
	</Glow>
</AudioFrequency>
