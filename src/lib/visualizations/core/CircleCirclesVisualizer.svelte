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
		minRadius = 0.15,
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
			const low = Math.max(0, minRadius);
			const high = Math.max(low, maxRadius);
			const minSize = (Math.PI * low * smaller) / values.length;
			const maxSize = (Math.PI * high * smaller) / values.length;
			ctx.fillStyle = color;
			for (let i = 0; i < values.length; i++) {
				const value = amplitude(values[i]);
				const radius = Math.max(low * smaller, value * (high - low) * smaller);
				const size = minSize + (maxSize - minSize) * value;
				ctx.save();
				ctx.translate(width / 2, height / 2);
				ctx.rotate((i / values.length) * Math.PI * 2 + rotate);
				if (startHue !== undefined && endHue !== undefined) {
					const t = 1 - Math.abs((i / values.length) * 2 - 1);
					const hue = startHue + t * (endHue - startHue);
					ctx.fillStyle = `hsl(${hue % 360}, 100%, ${varyBrightness ? 100 - Math.pow(value, 0.3) * 50 : 50}%)`;
				}
				ctx.beginPath();
				ctx.arc(-size / 2, radius, size / 2, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
			}
		})
	);
</script>

<canvas bind:this={canvas} aria-hidden="true" style="display: block; height: 100%; width: 100%;"
></canvas>
