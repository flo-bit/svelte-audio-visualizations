<script lang="ts">
	import type { WavRecorder, AudioFilePlayer } from '$lib/visualizations/wavtools';
	import { raf } from "./raf";
	import { normalizeArray } from "./wav_helper";

	export let audio:AudioFilePlayer | WavRecorder | null;

	let values:Float32Array = new Float32Array([0]);

	//Update frequency values every render frame
	raf(() => values = audio ? audio.getFrequencies('music').values : new Float32Array([0]));

	//Recreate the getValues function when values changes (to trigger reactivity)
	$:getValues = (detail:number)=>normalizeArray(values, detail)

</script>

<slot {values} {getValues} />