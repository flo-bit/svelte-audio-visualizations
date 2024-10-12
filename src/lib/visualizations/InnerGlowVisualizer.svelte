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

	export let colorTopLeft: string | undefined = undefined; //= '#7c3aed';
	export let colorTopRight: string | undefined = undefined; //= '#db2777';
	export let colorBottomLeft: string | undefined = undefined; // = '#2563eb';
	export let colorBottomRight: string | undefined = undefined; //= '#dc2626';

	// number of points to draw per side (each side has the same number of points)
	export let detail = 8;

	// how much of the shape is visible if audio is silent (in pixels)
	export let sideVisible = 5;
	// how much the shape moves inwards when audio is loud (in pixels)
	export let deformation = 10;

	let canvas: HTMLCanvasElement;
	let clientCtx: CanvasRenderingContext2D | null = null;
	let isLoaded = false;

	const emptyResult = { values: new Float32Array([0]) };

	const drawDeformedCircle = (
		canvas: HTMLCanvasElement,
		ctx: CanvasRenderingContext2D,
		data: Float32Array
	) => {
		const points = normalizeArray(data, detail * 4 + 1, true);

		if (color) ctx.fillStyle = color;

		ctx.beginPath();

		const outerSize = 20;

		if (color) ctx.fillStyle = color;
		else if (startHue !== undefined && endHue !== undefined) {
			// create radial gradient
			const gradient = ctx.createLinearGradient(
				0,
				canvas.height / 3,
				canvas.width,
				(canvas.height * 2) / 3
			);
			gradient.addColorStop(0, `hsl(${startHue % 360}, 100%, 30%)`);
			gradient.addColorStop(1, `hsl(${endHue % 360}, 100%, 50%)`);
			ctx.fillStyle = gradient;
		}

		// left side
		if (color) ctx.fillStyle = color;
		else if (colorTopLeft && colorBottomLeft) {
			const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
			gradient.addColorStop(0, colorTopLeft);
			gradient.addColorStop(1, colorBottomLeft);
			ctx.fillStyle = gradient;
		}
		ctx.moveTo(0, canvas.height);
		ctx.lineTo(-outerSize, canvas.height);
		ctx.lineTo(-outerSize, 0);
		ctx.lineTo(0, 0);
		for (let i = 0; i <= detail; i++) {
			const amplitude = points[i];

			ctx.lineTo(amplitude * deformation + sideVisible, (i / detail) * canvas.height);
		}
		ctx.fill();

		// bottom side
		if (color) ctx.fillStyle = color;
		else if (colorBottomLeft && colorBottomRight) {
			const gradient = ctx.createLinearGradient(0, canvas.height, canvas.width, canvas.height);
			gradient.addColorStop(0, colorBottomLeft);
			gradient.addColorStop(1, colorBottomRight);
			ctx.fillStyle = gradient;
		}
		ctx.beginPath();
		ctx.moveTo(canvas.width, canvas.height);
		ctx.lineTo(canvas.width, canvas.height + outerSize);
		ctx.lineTo(0, canvas.height + outerSize);
		ctx.lineTo(0, canvas.height);
		for (let i = detail; i <= detail * 2; i++) {
			const amplitude = points[i];

			ctx.lineTo(
				(i / detail - 1) * canvas.width,
				canvas.height - (amplitude * deformation + sideVisible)
			);
		}
		ctx.fill();

		// right side
		if (color) ctx.fillStyle = color;
		else if (colorTopRight && colorBottomRight) {
			const gradient = ctx.createLinearGradient(canvas.width, 0, canvas.width, canvas.height);
			gradient.addColorStop(0, colorTopRight);
			gradient.addColorStop(1, colorBottomRight);
			ctx.fillStyle = gradient;
		}
		ctx.beginPath();
		ctx.moveTo(canvas.width, 0);
		ctx.lineTo(canvas.width + outerSize, 0);
		ctx.lineTo(canvas.width + outerSize, canvas.height);
		ctx.lineTo(canvas.width, canvas.height);
		for (let i = detail * 2; i <= detail * 3; i++) {
			const amplitude = points[i];

			ctx.lineTo(
				canvas.width - (amplitude * deformation + sideVisible),
				(3 - i / detail) * canvas.height
			);
		}
		ctx.fill();

		// top side
		if (color) ctx.fillStyle = color;
		else if (colorTopLeft && colorTopRight) {
			const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
			gradient.addColorStop(0, colorTopLeft);
			gradient.addColorStop(1, colorTopRight);
			ctx.fillStyle = gradient;
		}
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(0, -outerSize);
		ctx.lineTo(canvas.width, -outerSize);
		ctx.lineTo(canvas.width, 0);
		for (let i = detail * 3; i <= detail * 4; i++) {
			const amplitude = points[i];

			ctx.lineTo(canvas.width * (4 - i / detail), amplitude * deformation + sideVisible);
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

	export let glow = 10;
</script>

<div style="height: 100%; width: 100%; filter: blur(12px)">
	<canvas bind:this={canvas} class="filter-blur-inner-glow" style="height: 100%; width: 100%;"
	></canvas>
</div>

{#if glow}
	<svg width="0" height="0">
		<filter id="blur-and-scale-inner-glow" y="-50%" x="-50%" width="200%" height="200%">
			<feGaussianBlur in="SourceGraphic" stdDeviation={glow} result="blurred" />
			<feColorMatrix type="saturate" in="blurred" values="20" />
			<feComposite in="SourceGraphic" operator="over" />
		</filter>
	</svg>

	<style>
		.filter-blur-inner-glow {
			filter: url(#blur-and-scale-inner-glow);
		}
	</style>
{/if}
