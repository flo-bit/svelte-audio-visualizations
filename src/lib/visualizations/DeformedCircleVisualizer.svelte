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

	export let minRadius: number = 0.1;
	export let maxRadius: number = 0.4;

	export let detail = 16;

	let canvas: HTMLCanvasElement;
	let clientCtx: CanvasRenderingContext2D | null = null;
	let isLoaded = false;

	const emptyResult = { values: new Float32Array([0]) };

	const drawDeformedCircle = (
		canvas: HTMLCanvasElement,
		ctx: CanvasRenderingContext2D,
		data: Float32Array
	) => {
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const points = normalizeArray(data, detail, true);
		const smaller = Math.min(canvas.width, canvas.height);

		if (color) ctx.fillStyle = color;
		else if (startHue !== undefined && endHue !== undefined) {
			// create radial gradient
			const gradient = ctx.createRadialGradient(
				centerX,
				centerY,
				0,
				centerX,
				centerY,
				maxRadius * smaller
			);
			gradient.addColorStop(0, `hsl(${startHue % 360}, 100%, 30%)`);
			gradient.addColorStop(1, `hsl(${endHue % 360}, 100%, 50%)`);
			ctx.fillStyle = gradient;
		}

		ctx.beginPath();

		const deformation = (maxRadius - minRadius) * smaller;

		for (let i = 0; i <= detail; i++) {
			const angle = (i / detail) * Math.PI * 2;
			const currentAmplitude = points[i % detail];

			const currentRadius = minRadius * smaller + currentAmplitude * deformation;

			const x1 = centerX + Math.sin(angle) * currentRadius;
			const y1 = centerY + Math.cos(angle) * currentRadius;

			if (i === 0) {
				ctx.moveTo(x1, y1);
			}
			ctx.lineTo(x1, y1);
		}

		ctx.fill();
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

		drawDeformedCircle(canvas, clientCtx, result.values);

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

	export let glow = 20;
</script>

<div style="width: 100%; height: 100%; filter: blur(24px);">
	<canvas bind:this={canvas} class="filter-blur-deformed" style="width: 100%; height: 100%"
	></canvas>
</div>

{#if glow}
	<svg width="0" height="0">
		<filter id="blur-and-scale-deformed" y="-50%" x="-50%" width="200%" height="200%">
			<feGaussianBlur in="SourceGraphic" stdDeviation={glow} result="blurred" />
			<feColorMatrix type="saturate" in="blurred" values="5" />
			<feComposite in="SourceGraphic" operator="over" />
		</filter>
	</svg>

	<style>
		.filter-blur-deformed {
			filter: url(#blur-and-scale-deformed);
		}
	</style>
{/if}
