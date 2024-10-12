<script lang="ts">
	import BarVisualizer from '$lib/visualizations/BarVisualizer.svelte';
	import CircleBarVisualizer from '$lib/visualizations/CircleBarVisualizer.svelte';
	import CircleCirclesVisualizer from '$lib/visualizations/CircleCirclesVisualizer.svelte';
	import DeformedCircleVisualizer from '$lib/visualizations/DeformedCircleVisualizer.svelte';
	import IconVisualizer from '$lib/visualizations/IconVisualizer.svelte';
	import InnerGlowVisualizer from '$lib/visualizations/InnerGlowVisualizer.svelte';
	import { WavRecorder, AudioFilePlayer } from '$lib/visualizations/wavtools';

	export let wavRecorder: WavRecorder = new WavRecorder({ sampleRate: 24000 });

	export let player = new AudioFilePlayer();

	export let currentlyPlaying: WavRecorder | AudioFilePlayer | null = null;

	let state: 'recording' | 'music' | null = null;

	let analysisType: 'voice' | 'frequency' | 'music' | undefined = 'music';

	async function microphone() {
		if (state === 'recording') {
			wavRecorder.end();
			state = null;
			return;
		}
		player.stop();

		await wavRecorder.begin();

		wavRecorder.record();

		currentlyPlaying = wavRecorder;

		state = 'recording';
	}

	async function music() {
		if (state === 'music') {
			player.stop();
			state = null;
			return;
		}
		if (wavRecorder.recording) wavRecorder.end();

		await player.loadFile('/svelte-audio-visualizations/music.mp3');

		player.play();
		currentlyPlaying = player;

		state = 'music';
	}
</script>

<div class="mx-auto px-4 max-w-4xl w-full py-24">
	<div>
		<div>
			<button
				type="button"
				on:click={microphone}
				class="rounded-full px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 {state ===
				'recording'
					? 'text-stone-500 bg-stone-500/10 border border-stone-500/20 hover:bg-stone-500/20'
					: 'text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20'}"
				>{state === 'recording' ? 'stop ' : 'start '}microphone</button
			>
			<button
				type="button"
				on:click={music}
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
				audioInput={currentlyPlaying}
				{analysisType}
				startHue={0}
				endHue={50}
				rotate={2}
			/>
		</div>
		<div class="h-64 w-full rounded-xl border border-white/15 p-4">
			<BarVisualizer
				audioInput={currentlyPlaying}
				{analysisType}
				barSpacing={8}
				startHue={0}
				endHue={50}
				center
			/>
		</div>

		<div class="h-64 w-full rounded-xl border border-white/15 p-4">
			<CircleCirclesVisualizer
				audioInput={currentlyPlaying}
				{analysisType}
				startHue={0}
				endHue={50}
			/>
		</div>
		<div class="h-64 w-full rounded-xl border border-white/15 p-4">
			<DeformedCircleVisualizer
				audioInput={currentlyPlaying}
				{analysisType}
				startHue={0}
				endHue={50}
			/>
		</div>
		<div class="h-64 w-full rounded-xl border border-white/15 overflow-hidden">
			<InnerGlowVisualizer audioInput={currentlyPlaying} {analysisType} startHue={0} endHue={50} />
		</div>
		<div
			class="h-64 w-full rounded-xl border border-white/15 overflow-hidden flex items-center justify-center gap-4"
		>
			<div class="size-20">
				<IconVisualizer audioInput={currentlyPlaying} {analysisType} />
			</div>
			<div class="size-20">
				<IconVisualizer audioInput={currentlyPlaying} {analysisType} icon="speaker" />
			</div>
		</div>
	</div>
</div>
