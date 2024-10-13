<script lang="ts">
	import BarVisualizer from '$lib/visualizations/BarVisualizer.svelte';
	import CircleBarVisualizer from '$lib/visualizations/CircleBarVisualizer.svelte';
	import CircleCirclesVisualizer from '$lib/visualizations/CircleCirclesVisualizer.svelte';
	import DeformedCircleVisualizer from '$lib/visualizations/DeformedCircleVisualizer.svelte';
	import IconVisualizer from '$lib/visualizations/IconVisualizer.svelte';
	import InnerGlowVisualizer from '$lib/visualizations/InnerGlowVisualizer.svelte';
	import { raf } from '$lib/visualizations/raf';
	import { normalizeArray } from '$lib/visualizations/wav_helper';
	import { WavRecorder, AudioFilePlayer } from '$lib/visualizations/wavtools';

	let wavRecorder: WavRecorder | null = null;
	let player: AudioFilePlayer | null = null;
	let state: 'recording' | 'music' | null = null;

	//Stop playing music, if wrong state
	$:if(state !== 'music' && wavRecorder){
		wavRecorder.end();
		wavRecorder = null;
	}

	//Stop recording, if wrong state
	$:if(state !== 'recording' && player){
		player.stop();
		player = null;
	}

	//Start playing music, if not playing already
	$:if(state == 'music' && !player){
		player = new AudioFilePlayer();
		player.loadFile('/svelte-audio-visualizations/music.mp3').then(()=>player?.play());
	}

	//Start recording, if not recording already
	$:if(state == 'recording' && !wavRecorder){
		wavRecorder = new WavRecorder({ sampleRate: 24000 })
		wavRecorder.begin().then(()=>wavRecorder?.record());
	}

	//Update values every render frame
	let values:Float32Array = new Float32Array([0]);
	raf(()=>{
		let v = wavRecorder || player || null;
		values = v ? v.getFrequencies('music').values : new Float32Array([0]);
	});

</script>

<div class="mx-auto px-4 max-w-4xl w-full py-24">
	<div>
		<div>
			<button
				type="button"
				on:click={()=>state = state == 'recording' ? null : 'recording'}
				class="rounded-full px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 {state ===
				'recording'
					? 'text-stone-500 bg-stone-500/10 border border-stone-500/20 hover:bg-stone-500/20'
					: 'text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20'}"
				>{state === 'recording' ? 'stop ' : 'start '}microphone</button
			>
			<button
				type="button"
				on:click={()=>state = state == 'music' ? null : "music"}
				class="rounded-full px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 {state ===
				'music'
					? 'text-stone-500 bg-stone-500/10 border border-stone-500/20 hover:bg-stone-500/20'
					: 'text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20'}"
				>{state === 'music' ? 'stop ' : 'start '}music</button
			>
		</div>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
		<div class="h-64 w-full rounded-xl border border-white/15 p-4">
			<CircleBarVisualizer
				values={normalizeArray(values, 50)}
				startHue={0}
				endHue={50}
				rotate={2}
			/>
		</div>
		<div class="h-64 w-full rounded-xl border border-white/15 p-4">
			<BarVisualizer
				values={normalizeArray(values, 16)}
				barSpacing={8}
				startHue={0}
				endHue={50}
				center
			/>
		</div>

		<div class="h-64 w-full rounded-xl border border-white/15 p-4">
			<CircleCirclesVisualizer
				values={normalizeArray(values, 50)}
				startHue={0}
				endHue={50}
			/>
		</div>
		<div class="h-64 w-full rounded-xl border border-white/15 p-4">
			<DeformedCircleVisualizer
				values={normalizeArray(values, 16)}
				startHue={0}
				endHue={50}
			/>
		</div>
		<div class="h-64 w-full rounded-xl border border-white/15 overflow-hidden">
			<InnerGlowVisualizer values={normalizeArray(values, 8)} startHue={0} endHue={50} />
		</div>
		<div
			class="h-64 w-full rounded-xl border border-white/15 overflow-hidden flex items-center justify-center gap-4"
		>
			<div class="size-20">
				<IconVisualizer value={normalizeArray(values, 1)[0]} />
			</div>
			<div class="size-20">
				<IconVisualizer value={normalizeArray(values, 1)[0]} icon="speaker" />
			</div>
		</div>
	</div>
</div>
