<script lang="ts">
	export let values:Float32Array;

	export let color: string | undefined = undefined;
	export let startHue: number | undefined = undefined;
	export let endHue: number | undefined = undefined;
	export let barWidth = 0;
	export let barSpacing = 0;
	export let center = false;
	export let glow = 3;

	let canvas: HTMLCanvasElement;
	let clientWidth: number;
	let clientHeight: number;

	$:if(canvas){
		const ctx = canvas.getContext('2d')!;

		//Update canvas size
		canvas.width = clientWidth;
		canvas.height = clientHeight;

		//Clear
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		let width = barWidth;
		let dets = values.length;

		if (!dets) {
			dets = Math.floor((canvas.width - barSpacing) / (Math.max(barWidth, 1) + barSpacing));
		}
		if (!barWidth) {
			width = (canvas.width - barSpacing) / dets - barSpacing;
		}

		if (color !== undefined) ctx.fillStyle = color;

		for (let i = 0; i < values.length; i++) {
			const amplitude = Math.abs(values[i]);
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

</script>

<div bind:clientWidth bind:clientHeight class="w-full h-full">
	<canvas bind:this={canvas} class="filter-blur-bar w-full h-full"></canvas>
</div>

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
