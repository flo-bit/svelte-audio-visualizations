<script lang="ts">
	import { onDestroy } from 'svelte';
	import AudioAnalysis from '../../src/lib/visualizations/audio/AudioAnalysis.svelte';
	import BarAudioVisualizer from '../../src/lib/visualizations/audio/BarAudioVisualizer.svelte';
	import BarVisualizer from '../../src/lib/visualizations/core/BarVisualizer.svelte';
	import Glow from '../../src/lib/visualizations/core/Glow.svelte';
	import MicrophoneVisualizer from '../../src/lib/visualizations/core/MicrophoneVisualizer.svelte';
	import type { AudioSource } from '../../src/lib/visualizations/audio/types';

	let source = $state.raw<AudioSource | null>(null);
	let mounted = $state(true);
	let active = $state(true);
	let bands = $state(16);
	let gain = $state(1);
	let width = $state(200);
	let fps = $state(60);
	let level = $state(0);
	let error = $state('');
	let inspection = $state('');
	let context: AudioContext | undefined;
	let oscillator: OscillatorNode | undefined;
	let generatedStream: MediaStream | undefined;
	let values = $state.raw<Float32Array>(new Float32Array([0.2, 0.8]));

	async function start(stream = false) {
		await context?.close();
		context = new AudioContext();
		oscillator = context.createOscillator();
		const analyser = context.createAnalyser();
		analyser.smoothingTimeConstant = 0;
		oscillator.connect(analyser);
		if (stream) {
			const destination = context.createMediaStreamDestination();
			oscillator.connect(destination);
			generatedStream = destination.stream;
			source = generatedStream;
		} else source = analyser;
		oscillator.start();
		await context.resume();
	}
	function inspect() {
		inspection = `${context?.state}:${generatedStream?.getAudioTracks()[0]?.readyState ?? 'no-stream'}`;
	}
	onDestroy(() => {
		oscillator?.stop();
		void context?.close();
	});
</script>

<button onclick={() => start()}>start analyser</button>
<button onclick={() => start(true)}>start stream</button>
<button
	onclick={() => {
		mounted = !mounted;
	}}>toggle mounted</button
>
<button
	onclick={() => {
		active = !active;
	}}>toggle active</button
>
<button
	onclick={() => {
		source = null;
	}}>clear source</button
>
<button
	onclick={() => {
		bands = 8;
	}}>change bands</button
>
<button
	onclick={() => {
		gain = 0;
	}}>mute gain</button
>
<button
	onclick={() => {
		width = 300;
	}}>resize</button
>
<button
	onclick={() => {
		fps = 5;
	}}>slow down</button
>
<button
	onclick={() => {
		values = new Float32Array([1, 0]);
	}}>change values</button
>
<button onclick={inspect}>inspect ownership</button>
<button onclick={() => context?.suspend()}>suspend context</button>
<button onclick={() => context?.resume()}>resume context</button>
<output data-testid="inspection">{inspection}</output>
<output data-testid="error">{error}</output>

{#if mounted}
	<AudioAnalysis
		{source}
		{active}
		{bands}
		{gain}
		{fps}
		attack={0}
		release={0}
		onerror={(cause) => {
			error = cause.message;
		}}
	>
		{#snippet children(frame)}
			<output data-testid="level">{frame.level.toFixed(3)}</output>
			<output data-testid="bands">{frame.values.length}</output>
			<div data-testid="analysis" style:width={`${width}px`} style="height: 100px;">
				<BarVisualizer values={frame.values} maxPixelRatio={1} />
			</div>
		{/snippet}
	</AudioAnalysis>
	<div data-testid="audio" style="width: 200px; height: 100px;">
		<BarAudioVisualizer {source} {active} {bands} {gain} {fps} attack={0} release={0} />
	</div>
{/if}
<div data-testid="pure" style="width: 200px; height: 100px;">
	<BarVisualizer {values} maxPixelRatio={1} />
</div>
<div style="width: 100px; height: 100px;">
	<Glow glow={1}><MicrophoneVisualizer value={level} /></Glow>
</div>
<div style="width: 100px; height: 100px;">
	<Glow glow={5}><MicrophoneVisualizer value={level} /></Glow>
</div>
