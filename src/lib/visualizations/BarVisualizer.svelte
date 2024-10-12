<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { WavRecorder, WavStreamPlayer, AudioFilePlayer } from './wavtools';
	import { normalizeArray } from './wav_helper';

	// props that can be passed to the component
	export let audioInput:
		| WavRecorder
		| WavStreamPlayer
		| AudioFilePlayer
		| null
		| (() => { values: Float32Array }) = null;

	export let analysisType: 'voice' | 'frequency' | 'music' | undefined = 'voice';

	export let color: string | undefined = undefined;
	export let startHue: number | undefined = undefined;
	export let endHue: number | undefined = undefined;

	// number of bars to draw
	export let detail = 16;

	export let barWidth = 0;

	export let barSpacing = 0;

	export let center = false;

	let canvas: HTMLCanvasElement;
	let clientCtx: CanvasRenderingContext2D | null = null;
	let isLoaded = false;

	const emptyResult = { values: new Float32Array([0]) };

	const drawBars = (
		canvas: HTMLCanvasElement,
		ctx: CanvasRenderingContext2D,
		data: Float32Array
	) => {
		detail = Math.floor(
			Math.min(detail, (canvas.width - barSpacing) / (Math.max(barWidth, 1) + barSpacing))
		);

		let width = barWidth;
		let dets = detail;

		if (!dets) {
			dets = Math.floor((canvas.width - barSpacing) / (Math.max(barWidth, 1) + barSpacing));
		}
		if (!barWidth) {
			width = (canvas.width - barSpacing) / dets - barSpacing;
		}

		if (color !== undefined) ctx.fillStyle = color;

		const points = normalizeArray(data, dets, true);
		for (let i = 0; i < dets; i++) {
			const amplitude = Math.abs(points[i]);
			const height = Math.max(1, amplitude * canvas.height);
			const x = barSpacing + i * (width + barSpacing);
			const y = center ? (canvas.height - height) / 2 : canvas.height - height;

			if (startHue !== undefined && endHue !== undefined) {
				let t = i / dets;

				const hue = (startHue ?? 0) + t * (endHue - startHue);
				ctx.fillStyle = `hsl(${hue % 360}, 100%, 50%)`;
			}
			ctx.fillRect(x, y, width, height);
		}
	};

	const render = () => {
		if (!isLoaded) return;

		if (!canvas) {
			window.requestAnimationFrame(render);
			return;
		}

		clientCtx = clientCtx ?? canvas.getContext('2d');
		if (!clientCtx) {
			window.requestAnimationFrame(render);
			return;
		}
		clientCtx.clearRect(0, 0, canvas.width, canvas.height);

		let result = emptyResult;

		if (
			(audioInput instanceof WavRecorder && audioInput.recording) ||
			(audioInput instanceof WavStreamPlayer && audioInput.analyser) ||
			(audioInput instanceof AudioFilePlayer && audioInput.analyser)
		) {
			result = audioInput.getFrequencies(analysisType);
		} else if (typeof audioInput === 'function') {
			result = audioInput();
		}

		drawBars(canvas, clientCtx, result.values);

		window.requestAnimationFrame(render);
	};

	onMount(() => {
		isLoaded = true;

		// resize canvas to fit parent
		if (canvas) {
			canvas.width = canvas.offsetWidth * 2;
			canvas.height = canvas.offsetHeight * 2;
		}
		window.addEventListener('resize', () => {
			if (canvas) {
				canvas.width = canvas.offsetWidth * 2;
				canvas.height = canvas.offsetHeight * 2;
			}
		});

		render();
	});

	onDestroy(() => {
		isLoaded = false;
	});

	export let glow = 3;
</script>

<canvas bind:this={canvas} class="filter-blur-bar" style="width: 100%; height: 100%"></canvas>

{#if glow}
	<svg width="0" height="0">
		<filter id="blur-and-scale-bar" y="-50%" x="-50%" width="200%" height="200%">
			<feGaussianBlur in="SourceGraphic" stdDeviation={glow} result="blurred" />
			<feColorMatrix type="saturate" in="blurred" values="5" />
			<feComposite in="SourceGraphic" operator="over" />
		</filter>
	</svg>

	<style>
		.filter-blur-bar {
			filter: url(#blur-and-scale-bar);
		}
	</style>
{/if}
