<script lang="ts">
	import BarVisualizer from '$lib/visualizations/BarVisualizer.svelte';
	import CircleBarVisualizer from '$lib/visualizations/CircleBarVisualizer.svelte';
	import CircleCirclesVisualizer from '$lib/visualizations/CircleCirclesVisualizer.svelte';
	import DeformedCircleVisualizer from '$lib/visualizations/DeformedCircleVisualizer.svelte';
	import InnerGlowVisualizer from '$lib/visualizations/InnerGlowVisualizer.svelte';
	import MicrophoneVisualizer from '$lib/visualizations/MicrophoneVisualizer.svelte';
	import SpeakerVisualizer from '$lib/visualizations/SpeakerVisualizer.svelte';
	import Glow from '$lib/visualizations/Glow.svelte';
	import AudioFrequency from '$lib/visualizations/AudioFrequency.svelte';
	import { WavRecorder, AudioFilePlayer } from '$lib/visualizations/wavtools';
	import BarAudioVisualizer from '$lib/visualizations/BarAudioVisualizer.svelte';

	let audio: WavRecorder | AudioFilePlayer | null = null;
	let state: 'recording' | 'music' | null = null;

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

</script>

<!-- Example of creating a higher order component, that combines -->
<div style="width:300px;height:300px;">
	<BarAudioVisualizer
		{audio}
		startHue={0}
		endHue={50}
		rotate={2}
	/>
</div>

<AudioFrequency {audio} let:getValues >
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
						values={getValues(50)}
						startHue={0}
						endHue={50}
						rotate={2}
					/>
				</Glow>
			</div>
			<div class="h-64 w-full rounded-xl border border-white/15 p-4">
				<Glow>
					<BarVisualizer
						values={getValues(16)}
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
						values={getValues(50)}
						startHue={0}
						endHue={50}
					/>
				</Glow>
			</div>
			<div class="h-64 w-full rounded-xl border border-white/15 p-4">
				<Glow glow={20}>
					<DeformedCircleVisualizer
						values={getValues(16)}
						startHue={0}
						endHue={50}
					/>
				</Glow>
			</div>
			<div class="h-64 w-full rounded-xl border border-white/15 overflow-hidden">
				<Glow glow={10}>
					<InnerGlowVisualizer values={getValues(8)} startHue={0} endHue={50} />
				</Glow>
			</div>
			<div
				class="h-64 w-full rounded-xl border border-white/15 overflow-hidden flex items-center justify-center gap-4"
			>
				<div class="size-20">
					<MicrophoneVisualizer value={getValues(1)[0]} />
				</div>
				<div class="size-20">
					<SpeakerVisualizer value={getValues(1)[0]} />
				</div>
			</div>
		</div>
	</div>
</AudioFrequency>