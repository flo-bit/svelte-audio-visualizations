<script lang="ts">
	import type { WavRecorder, AudioFilePlayer, WavStreamPlayer } from '$lib/visualizations/wavtools';
	import AudioFrequency from './AudioFrequency.svelte';
	import Glow from '../core/Glow.svelte';
	import MicrophoneVisualizer from '../core/MicrophoneVisualizer.svelte';

	export let audio: AudioFilePlayer | WavRecorder | WavStreamPlayer | null;
	export let glow: number | undefined = 3;
	export let analysisType: 'music' | 'voice' | 'frequency' = 'frequency';
</script>

<AudioFrequency {audio} {analysisType} let:getValues>
	<Glow {glow}>
		<MicrophoneVisualizer value={getValues(1)[0]} {...$$restProps} />
	</Glow>
</AudioFrequency>
