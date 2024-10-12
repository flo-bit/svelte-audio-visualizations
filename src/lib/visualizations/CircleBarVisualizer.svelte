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

	export let minRadius: number = 0.3;
	export let maxRadius: number = 0.5;

	export let rotate = 1;

	// number of bars to draw
	export let detail = 50;

	// will make the bars white when amplitude is 0
	export let varyBrightness = false;

	let canvas: HTMLCanvasElement;
	let clientCtx: CanvasRenderingContext2D | null = null;
	let isLoaded = false;

	const emptyResult = { values: new Float32Array([0]) };

	const drawCircularBars = (
		canvas: HTMLCanvasElement,
		ctx: CanvasRenderingContext2D,
		data: Float32Array
	) => {
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const points = normalizeArray(data, detail, true);
		const smaller = Math.min(canvas.width, canvas.height);
		const barWidth = (Math.PI * 2 * minRadius * smaller) / detail / 2;
		const maxBarHeight = (maxRadius - minRadius) * smaller;
		const hueRange = (endHue ?? 0) - (startHue ?? 0);

		if (color !== undefined) {
			ctx.fillStyle = color;
		}

		for (let i = 0; i < detail; i++) {
			const amplitude = points[i];
			const barHeight = Math.max(barWidth, amplitude * maxBarHeight);
			const angle = (i / detail) * Math.PI * 2 + rotate;

			// Save the current context state
			ctx.save();

			// Translate and rotate the context to position the roundRect
			ctx.translate(centerX, centerY);
			ctx.rotate(angle);

			if (startHue !== undefined && endHue !== undefined) {
				// t goes from 0 to 1, then back to 0 (startHue to endHue back to startHue)
				let t = (i / detail) * 2;
				if (t > 1) {
					t = 2 - t;
				}
				const hue = (startHue ?? 0) + t * hueRange;

				ctx.fillStyle = `hsl(${hue % 360}, 100%, ${varyBrightness ? 100 - Math.pow(amplitude, 0.3) * 50 : 50}%)`;
			}

			ctx.beginPath();
			ctx.roundRect(-barWidth / 2, minRadius * smaller, barWidth, barHeight, barWidth);
			ctx.fill();
			ctx.translate(-centerX, -centerY);

			ctx.restore();
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

		drawCircularBars(canvas, clientCtx, result.values);

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

<canvas bind:this={canvas} class="filter-blur-circle-bars" style="width: 100%; height: 100%"
></canvas>

{#if glow}
	<svg width="0" height="0">
		<filter id="blur-and-scale-circle-bars" y="-50%" x="-50%" width="200%" height="200%">
			<feGaussianBlur in="SourceGraphic" stdDeviation={glow} result="blurred" />
			<feColorMatrix type="saturate" in="blurred" values="5" />
			<feComposite in="SourceGraphic" operator="over" />
		</filter>
	</svg>

	<style>
		.filter-blur-circle-bars {
			filter: url(#blur-and-scale-circle-bars);
		}
	</style>
{/if}
