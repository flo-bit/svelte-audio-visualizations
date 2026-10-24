<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { base } from '$app/paths';
	import { resumeAudio } from '$lib/visualizations/audio/source';
	import type { AudioSource } from '$lib/visualizations/audio/types';
	import CircleBarAudioVisualizer from '$lib/visualizations/audio/CircleBarAudioVisualizer.svelte';
	import BarAudioVisualizer from '$lib/visualizations/audio/BarAudioVisualizer.svelte';
	import CircleCirclesAudioVisualizer from '$lib/visualizations/audio/CircleCirclesAudioVisualizer.svelte';
	import DeformedCircleAudioVisualizer from '$lib/visualizations/audio/DeformedCircleAudioVisualizer.svelte';
	import InnerGlowAudioVisualizer from '$lib/visualizations/audio/InnerGlowAudioVisualizer.svelte';
	import MicrophoneAudioVisualizer from '$lib/visualizations/audio/MicrophoneAudioVisualizer.svelte';
	import SpeakerAudioVisualizer from '$lib/visualizations/audio/SpeakerAudioVisualizer.svelte';

	let player = $state<HTMLAudioElement>();
	let stream = $state.raw<MediaStream>();
	let mode = $state<'microphone' | 'music' | null>(null);
	let busy = $state(false);
	let ready = $state(false);
	onMount(() => {
		ready = true;
	});
	let error = $state('');
	let generation = 0;
	const source = $derived<AudioSource | null>(
		mode === 'microphone' ? (stream ?? null) : mode === 'music' ? (player ?? null) : null
	);
	const preset = $derived(mode === 'microphone' ? 'voice' : 'music');

	function reportError(cause: Error) {
		error = cause.message;
	}
	function stopMicrophone() {
		stream?.getTracks().forEach((track) => track.stop());
		stream = undefined;
		if (mode === 'microphone') mode = null;
	}
	async function microphone() {
		if (mode === 'microphone') {
			stopMicrophone();
			return;
		}
		const request = ++generation;
		busy = true;
		error = '';
		player?.pause();
		try {
			if (!navigator.mediaDevices?.getUserMedia)
				throw new Error('Microphone access requires HTTPS or localhost.');
			const next = await navigator.mediaDevices.getUserMedia({ audio: true });
			if (request !== generation) {
				next.getTracks().forEach((track) => track.stop());
				return;
			}
			stream = next;
			mode = 'microphone';
			for (const track of next.getAudioTracks())
				track.addEventListener('ended', stopMicrophone, { once: true });
		} catch (cause) {
			if (request === generation) error = cause instanceof Error ? cause.message : String(cause);
		} finally {
			if (request === generation) busy = false;
		}
	}
	async function music() {
		if (!player) return;
		if (mode === 'music') {
			player.pause();
			return;
		}
		const request = ++generation;
		busy = true;
		error = '';
		stopMicrophone();
		try {
			// Invoke resume inside the user gesture, before waiting for file playback.
			await resumeAudio(player);
			if (request !== generation) return;
			await player.play();
		} catch (cause) {
			if (request === generation) error = cause instanceof Error ? cause.message : String(cause);
		} finally {
			if (request === generation) busy = false;
		}
	}
	function playing() {
		generation++;
		busy = false;
		stopMicrophone();
		mode = 'music';
		if (player) void resumeAudio(player).catch(reportError);
	}
	onDestroy(() => {
		generation++;
		stopMicrophone();
		player?.pause();
	});
</script>

<svelte:head>
	<title>Svelte audio visualizations</title>
	<meta
		name="description"
		content="Copyable Svelte 5 audio visualizations for media elements, microphones and Web Audio."
	/>
</svelte:head>

<main class="mx-auto px-4 max-w-4xl w-full py-8 sm:py-24">
	<div class="flex justify-between gap-4 flex-wrap">
		<div>
			<h1 class="text-xl font-semibold text-stone-100">Svelte audio visualizations</h1>
			<p class="text-stone-400 text-sm mt-2">
				Native audio. Copyable components. No recording library required.
			</p>
		</div>
		<div class="text-stone-500 text-sm font-semibold">
			made by <a href="https://flo-bit.dev/" class="text-amber-600">flo-bit</a>
		</div>
	</div>
	<div class="flex gap-3 flex-wrap mt-6">
		<button
			type="button"
			onclick={microphone}
			disabled={busy || !ready}
			aria-pressed={mode === 'microphone'}
		>
			{mode === 'microphone' ? 'stop' : 'start'} microphone
		</button>
		<button type="button" onclick={music} disabled={busy || !ready} aria-pressed={mode === 'music'}>
			{mode === 'music' ? 'stop' : 'start'} music
		</button>
	</div>
	{#if busy}<p role="status" class="text-stone-400 mt-3 text-sm">Connecting audio…</p>{/if}
	{#if error}<p role="alert" class="text-red-400 mt-3">{error}</p>{/if}
	<!-- Playback belongs to the application, not to the visualizations. -->
	<audio
		bind:this={player}
		src={`${base}/music.mp3`}
		hidden
		preload="none"
		onplay={playing}
		onpause={() => {
			if (mode === 'music') mode = null;
		}}
		onended={() => {
			if (mode === 'music') mode = null;
		}}
		onerror={() => reportError(new Error('Could not load the demo music.'))}
	></audio>

	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
		<div class="tile p-4">
			<CircleBarAudioVisualizer
				{source}
				{preset}
				startHue={0}
				endHue={50}
				rotate={2}
				glow={3}
				onerror={reportError}
			/>
		</div>
		<div class="tile p-4">
			<BarAudioVisualizer
				{source}
				{preset}
				bands={20}
				barSpacing={4}
				startHue={0}
				endHue={50}
				center
				glow={3}
				onerror={reportError}
			/>
		</div>
		<div class="tile p-4">
			<CircleCirclesAudioVisualizer
				{source}
				{preset}
				startHue={0}
				endHue={50}
				glow={3}
				onerror={reportError}
			/>
		</div>
		<div class="tile p-4">
			<DeformedCircleAudioVisualizer
				{source}
				{preset}
				bands={8}
				startHue={0}
				endHue={50}
				onerror={reportError}
			/>
		</div>
		<div class="tile overflow-hidden">
			<InnerGlowAudioVisualizer {source} {preset} startHue={0} endHue={50} onerror={reportError} />
		</div>
		<div class="tile overflow-hidden flex items-center justify-center gap-4">
			<div class="size-20">
				<MicrophoneAudioVisualizer {source} gain={3} onerror={reportError} />
			</div>
			<div class="size-20"><SpeakerAudioVisualizer {source} gain={3} onerror={reportError} /></div>
		</div>
	</div>
</main>

<style>
	button {
		border-radius: 999px;
		padding: 0.5rem 0.9rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #f59e0b;
		background: #f59e0b1a;
		border: 1px solid #f59e0b33;
	}
	button:hover {
		background: #f59e0b33;
	}
	button:focus-visible {
		outline: 2px solid #f59e0b;
		outline-offset: 3px;
	}
	button:disabled {
		opacity: 0.5;
		cursor: wait;
	}
	button[aria-pressed='true'] {
		color: #a8a29e;
		border-color: #78716c33;
		background: #78716c1a;
	}
	.tile {
		height: 16rem;
		width: 100%;
		min-width: 0;
		border-radius: 0.75rem;
		border: 1px solid #ffffff26;
	}
</style>
