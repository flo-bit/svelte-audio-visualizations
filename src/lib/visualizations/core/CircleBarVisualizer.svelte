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
		/** Rotation in radians. */
		rotate?: number;
		varyBrightness?: boolean;
		maxPixelRatio?: number;
	}
	let {
		values,
		color = '#f59e0b',
		startHue,
		endHue,
		minRadius = 0.3,
		maxRadius = 0.5,
		rotate = 1,
		varyBrightness = false,
		maxPixelRatio = 2
	}: Props = $props();
	let canvas = $state<HTMLCanvasElement>();
	const surface = canvasSurface(
		() => canvas,
		() => maxPixelRatio
	);

	$effect(() =>
		surface.draw((ctx, width, height) => {
			if (!values.length) return;
			const smaller = Math.min(width, height);
			const radius = Math.max(0, minRadius) * smaller;
			const barWidth = (Math.PI * radius) / values.length;
			const maxHeight = Math.max(0, maxRadius - minRadius) * smaller;
			ctx.fillStyle = color;
			for (let i = 0; i < values.length; i++) {
				const value = amplitude(values[i]);
				ctx.save();
				ctx.translate(width / 2, height / 2);
				ctx.rotate((i / values.length) * Math.PI * 2 + rotate);
				if (startHue !== undefined && endHue !== undefined) {
					const t = 1 - Math.abs((i / values.length) * 2 - 1);
					const hue = startHue + t * (endHue - startHue);
					ctx.fillStyle = `hsl(${hue % 360}, 100%, ${varyBrightness ? 100 - Math.pow(value, 0.3) * 50 : 50}%)`;
				}
				ctx.beginPath();
				ctx.roundRect(
					-barWidth / 2,
					radius,
					barWidth,
					Math.max(barWidth, value * maxHeight),
					barWidth / 2
				);
				ctx.fill();
				ctx.restore();
			}
		})
	);
</script>

<canvas bind:this={canvas} aria-hidden="true" style="display: block; height: 100%; width: 100%;"
></canvas>
