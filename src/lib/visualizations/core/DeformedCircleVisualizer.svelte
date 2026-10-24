<script lang="ts">
	import { canvasSurface } from './canvas.svelte';
	import { amplitude } from './utils';

	interface Props {
		values: ArrayLike<number>;
		color?: string;
		startHue?: number;
		endHue?: number;
		/** Radii as fractions of the shorter canvas dimension. */
		minRadius?: number;
		maxRadius?: number;
		/** Blur in CSS pixels. Zero disables it. */
		blur?: number;
		maxPixelRatio?: number;
	}
	let {
		values,
		color = '#f59e0b',
		startHue,
		endHue,
		minRadius = 0.1,
		maxRadius = 0.4,
		blur = 24,
		maxPixelRatio = 2
	}: Props = $props();
	let canvas = $state<HTMLCanvasElement>();
	const surface = canvasSurface(
		() => canvas,
		() => maxPixelRatio
	);
	let gradient: CanvasGradient | undefined;
	let gradientKey = '';

	$effect(() =>
		surface.draw((ctx, width, height) => {
			if (!values.length) return;
			const smaller = Math.min(width, height);
			const low = Math.max(0, minRadius);
			const high = Math.max(low, maxRadius);
			ctx.fillStyle = color;
			if (startHue !== undefined && endHue !== undefined && high > 0) {
				const key = `${width}:${height}:${ctx.canvas.width}:${ctx.canvas.height}:${high}:${startHue}:${endHue}`;
				if (!gradient || key !== gradientKey) {
					gradient = ctx.createRadialGradient(
						width / 2,
						height / 2,
						0,
						width / 2,
						height / 2,
						high * smaller
					);
					gradient.addColorStop(0, `hsl(${startHue % 360}, 100%, 30%)`);
					gradient.addColorStop(1, `hsl(${endHue % 360}, 100%, 50%)`);
					gradientKey = key;
				}
				ctx.fillStyle = gradient;
			}
			ctx.beginPath();
			for (let i = 0; i < values.length; i++) {
				const angle = (i / values.length) * Math.PI * 2;
				const radius = (low + amplitude(values[i]) * (high - low)) * smaller;
				const x = width / 2 + Math.sin(angle) * radius;
				const y = height / 2 + Math.cos(angle) * radius;
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.closePath();
			ctx.fill();
		})
	);
</script>

<canvas
	bind:this={canvas}
	aria-hidden="true"
	style:filter={blur > 0 ? `blur(${blur}px)` : undefined}
	style="display: block; height: 100%; width: 100%;"
></canvas>
