<script lang="ts">
	import BarVisualizer from '$lib/visualizations/BarVisualizer.svelte';
	import CircleBarVisualizer from '$lib/visualizations/CircleBarVisualizer.svelte';
	import CircleCirclesVisualizer from '$lib/visualizations/CircleCirclesVisualizer.svelte';
	import DeformedCircleVisualizer from '$lib/visualizations/DeformedCircleVisualizer.svelte';
	import Glow from '$lib/visualizations/Glow.svelte';
	import InnerGlowVisualizer from '$lib/visualizations/InnerGlowVisualizer.svelte';
	import MicrophoneVisualizer from '$lib/visualizations/MicrophoneVisualizer.svelte';
	import { raf } from '$lib/visualizations/raf';
	import SpeakerVisualizer from '$lib/visualizations/SpeakerVisualizer.svelte';
	import { normalizeArray } from '$lib/visualizations/wav_helper';
	import { WavRecorder, AudioFilePlayer } from '$lib/visualizations/wavtools';

	let audio: WavRecorder | AudioFilePlayer | null = null;
	let state: 'recording' | 'music' | null = null;
	let values:Float32Array = new Float32Array([0]);

	//Stop playing music, if wrong state
	$:if(state !== 'music' && audio instanceof WavRecorder){
		audio.end();
		audio = null;
	}

	//Stop recording, if wrong state
	$:if(state !== 'recording' && audio instanceof AudioFilePlayer){
		audio.stop();
		audio = null;
	}

	//Start playing music, if not playing already
	$:if(state == 'music' && !audio){
		let player = audio = new AudioFilePlayer();
		audio.loadFile('/svelte-audio-visualizations/music.mp3').then(()=>player.play());
	}

	//Start recording, if not recording already
	$:if(state == 'recording' && !audio){
		let recorder = audio = new WavRecorder({ sampleRate: 24000 });
		audio.begin().then(()=>recorder.record());
	}

	//Update frequency values every render frame
	raf(() => values = audio ? audio.getFrequencies('music').values : new Float32Array([0]));

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
			<Glow>
				<CircleBarVisualizer
					values={normalizeArray(values, 50)}
					startHue={0}
					endHue={50}
					rotate={2}
				/>
			</Glow>
		</div>
		<div class="h-64 w-full rounded-xl border border-white/15 p-4">
			<Glow>
				<BarVisualizer
					values={normalizeArray(values, 16)}
					barSpacing={8}
					startHue={0}
					endHue={50}
					center
				/>
			</Glow>
		</div>

		<div class="h-64 w-full rounded-xl border border-white/15 p-4">
			<Glow>
				<CircleCirclesVisualizer
					values={normalizeArray(values, 50)}
					startHue={0}
					endHue={50}
				/>
			</Glow>
		</div>
		<div class="h-64 w-full rounded-xl border border-white/15 p-4">
			<Glow glow={20}>
				<DeformedCircleVisualizer
					values={normalizeArray(values, 16)}
					startHue={0}
					endHue={50}
				/>
			</Glow>
		</div>
		<div class="h-64 w-full rounded-xl border border-white/15 overflow-hidden">
			<Glow glow={10}>
				<InnerGlowVisualizer values={normalizeArray(values, 8)} startHue={0} endHue={50} />
			</Glow>
		</div>
		<div
			class="h-64 w-full rounded-xl border border-white/15 overflow-hidden flex items-center justify-center gap-4"
		>
			<div class="size-20">
				<MicrophoneVisualizer value={normalizeArray(values, 1)[0]} />
			</div>
			<div class="size-20">
				<SpeakerVisualizer value={normalizeArray(values, 1)[0]} />
			</div>
		</div>
	</div>
</div>
