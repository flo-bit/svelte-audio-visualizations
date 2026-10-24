<script lang="ts">
	import { canvasSurface } from './canvas.svelte';
	import { amplitude } from './utils';

	interface Props {
		values: ArrayLike<number>;
		color?: string;
		startHue?: number;
		endHue?: number;
		colorTopLeft?: string;
		colorTopRight?: string;
		colorBottomLeft?: string;
		colorBottomRight?: string;
		/** Edge thickness, deformation and blur in CSS pixels. */
		sideVisible?: number;
		deformation?: number;
		blur?: number;
		maxPixelRatio?: number;
	}
	let {
		values,
		color = '#f59e0b',
		startHue,
		endHue,
		colorTopLeft,
		colorTopRight,
		colorBottomLeft,
		colorBottomRight,
		sideVisible = 5,
		deformation = 10,
		blur = 12,
		maxPixelRatio = 2
	}: Props = $props();
	let canvas = $state<HTMLCanvasElement>();
	const surface = canvasSurface(
		() => canvas,
		() => maxPixelRatio
	);
	let gradientKey = '';
	let fills: (string | CanvasGradient)[] = [];

	$effect(() =>
		surface.draw((ctx, width, height) => {
			if (!values.length) return;
			const key = [
				width,
				height,
				ctx.canvas.width,
				ctx.canvas.height,
				color,
				startHue,
				endHue,
				colorTopLeft,
				colorTopRight,
				colorBottomLeft,
				colorBottomRight
			].join(':');
			if (key !== gradientKey) {
				let base: string | CanvasGradient = color;
				if (startHue !== undefined && endHue !== undefined) {
					const gradient = ctx.createLinearGradient(0, height / 3, width, (height * 2) / 3);
					gradient.addColorStop(0, `hsl(${startHue % 360}, 100%, 30%)`);
					gradient.addColorStop(1, `hsl(${endHue % 360}, 100%, 50%)`);
					base = gradient;
				}
				const corners = [
					[colorTopLeft, colorBottomLeft],
					[colorBottomLeft, colorBottomRight],
					[colorBottomRight, colorTopRight],
					[colorTopRight, colorTopLeft]
				];
				fills = corners.map(([from, to], side) => {
					if (!from || !to) return base;
					const gradient =
						side === 0
							? ctx.createLinearGradient(0, 0, 0, height)
							: side === 1
								? ctx.createLinearGradient(0, height, width, height)
								: side === 2
									? ctx.createLinearGradient(width, height, width, 0)
									: ctx.createLinearGradient(width, 0, 0, 0);
					gradient.addColorStop(0, from);
					gradient.addColorStop(1, to);
					return gradient;
				});
				gradientKey = key;
			}
			for (let side = 0; side < 4; side++) {
				const length = side % 2 === 0 ? height : width;
				function point(inward: number, along: number, move = false) {
					const x =
						side === 0 ? inward : side === 1 ? along : side === 2 ? width - inward : width - along;
					const y =
						side === 0
							? along
							: side === 1
								? height - inward
								: side === 2
									? height - along
									: inward;
					if (move) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				}
				ctx.fillStyle = fills[side];
				ctx.beginPath();
				point(-20, -20, true);
				point(-20, length + 20);
				for (let i = values.length - 1; i >= 0; i--) {
					point(
						Math.max(0, sideVisible + amplitude(values[i]) * deformation),
						(i / Math.max(1, values.length - 1)) * length
					);
				}
				ctx.closePath();
				ctx.fill();
			}
		})
	);
</script>

<canvas
	bind:this={canvas}
	aria-hidden="true"
	style:filter={blur > 0 ? `blur(${blur}px)` : undefined}
	style="display: block; height: 100%; width: 100%;"
></canvas>
