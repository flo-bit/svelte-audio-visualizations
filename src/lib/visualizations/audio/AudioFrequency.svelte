<script lang="ts">
	import type { WavRecorder, AudioFilePlayer, WavStreamPlayer } from '$lib/visualizations/wavtools';
	import { raf, normalizeArray } from '../core/utils';

	export let audio: AudioFilePlayer | WavRecorder | WavStreamPlayer | null;

	let values: Float32Array = new Float32Array([0]);

	//Update frequency values every render frame
	raf(() => (values = audio ? audio.getFrequencies('music').values : new Float32Array([0])));

	//Recreate the getValues function when values changes (to trigger reactivity)
	$: getValues = (detail: number) => normalizeArray(values, detail);
</script>

<slot {values} {getValues} />
