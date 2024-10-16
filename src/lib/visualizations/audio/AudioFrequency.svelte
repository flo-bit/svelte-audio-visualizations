<script lang="ts">
	import { WavRecorder, AudioFilePlayer, WavStreamPlayer } from '$lib/visualizations/wavtools';
	import { raf, normalizeArray } from '../core/utils';

	export let audio: AudioFilePlayer | WavRecorder | WavStreamPlayer | null;
	export let analysisType: 'music' | 'voice' | 'frequency' = 'frequency';
	export let minDecibels: number = -100;
	export let maxDecibels: number = -30;

	let values: Float32Array = new Float32Array([0]);

	//Update frequency values every render frame
	raf(() => {
		if(!audio) {
			values = new Float32Array([0]);
			return;
		}

		if(audio instanceof WavRecorder && !audio.recording) {
			values = new Float32Array([0]);
			return;
		}
		
		values = audio.getFrequencies(analysisType, minDecibels, maxDecibels).values;
	});

	//Recreate the getValues function when values changes (to trigger reactivity)
	$: getValues = (detail: number) => normalizeArray(values, detail);
</script>

<slot {values} {getValues} />
