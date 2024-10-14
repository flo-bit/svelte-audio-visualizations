<script lang="ts">
	import type { WavRecorder, AudioFilePlayer } from '$lib/visualizations/wavtools';
	import AudioFrequency from './AudioFrequency.svelte';
	import Glow from './Glow.svelte';
	import CircleBarVisualizer from './CircleBarVisualizer.svelte';

	export let audio:AudioFilePlayer | WavRecorder | null;
	export let glow:number | undefined = 3;
	export let detail:number | undefined = 50;
</script>

<AudioFrequency {audio} let:getValues >
	<Glow {glow}>
		<CircleBarVisualizer
			values={getValues(detail || 50)}
			{...$$restProps}
		/>
	</Glow>
</AudioFrequency>