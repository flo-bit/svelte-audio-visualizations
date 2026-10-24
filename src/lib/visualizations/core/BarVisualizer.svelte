<script lang="ts">
	import { canvasSurface } from './canvas.svelte';
	import { amplitude } from './utils';

	interface Props {
		values: ArrayLike<number>;
		color?: string;
		startHue?: number;
		endHue?: number;
		/** Width/spacing in CSS pixels. Zero width fits bars to the canvas. */
		barWidth?: number;
		barSpacing?: number;
		center?: boolean;
		maxPixelRatio?: number;
	}
	let {
		values,
		color = '#f59e0b',
		startHue,
		endHue,
		barWidth = 0,
		barSpacing = 0,
		center = false,
		maxPixelRatio = 2
	}: Props = $props();
	let canvas = $state<HTMLCanvasElement>();
	const surface = canvasSurface(
		() => canvas,
		() => maxPixelRatio
	);

	$effect(() =>
		surface.draw((ctx, width, height) => {
			const count = values.length;
			if (!count) return;
			const spacing = Math.max(0, barSpacing);
			const size = barWidth > 0 ? barWidth : Math.max(0, (width - spacing * (count + 1)) / count);
			ctx.fillStyle = color;
			for (let i = 0; i < count; i++) {
				const barHeight = Math.max(1, amplitude(values[i]) * height);
				if (startHue !== undefined && endHue !== undefined) {
					const hue = startHue + (i / Math.max(1, count - 1)) * (endHue - startHue);
					ctx.fillStyle = `hsl(${hue % 360}, 100%, 50%)`;
				}
				ctx.fillRect(
					spacing + i * (size + spacing),
					center ? (height - barHeight) / 2 : height - barHeight,
					size,
					barHeight
				);
			}
		})
	);
</script>

<canvas bind:this={canvas} aria-hidden="true" style="display: block; height: 100%; width: 100%;"
></canvas>
