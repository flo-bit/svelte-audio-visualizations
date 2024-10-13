<script lang="ts">
	export let values:Float32Array;	

	export let color: string | undefined = undefined;
	export let startHue: number | undefined = undefined;
	export let endHue: number | undefined = undefined;
	export let minRadius: number = 0.15;
	export let maxRadius: number = 0.5;
	export let rotate = 1;
	export let varyBrightness = false;
	export let glow = 3;

	let canvas: HTMLCanvasElement;
	let clientWidth:number;
	let clientHeight:number;

	$:if(canvas){
		const ctx = canvas.getContext('2d')!;

		//Update canvas size
		canvas.width = clientWidth;
		canvas.height = clientHeight;

		//Clear
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		//const points = normalizeArray(data, detail, true);
		const smaller = Math.min(canvas.width, canvas.height);

		const minCircleSize = (Math.PI * 2 * minRadius * smaller) / values.length / 2;
		const maxCircleSize = (Math.PI * 2 * maxRadius * smaller) / values.length / 2;

		const minCircleHeight = minRadius * smaller;
		const maxCircleHeight = (maxRadius - minRadius) * smaller;
		const hueRange = (endHue ?? 0) - (startHue ?? 0);

		if (color !== undefined) {
			ctx.fillStyle = color;
		}

		for (let i = 0; i < values.length; i++) {
			const amplitude = values[i];
			const circleHeight = Math.max(minCircleHeight, amplitude * maxCircleHeight);
			const circleSize = minCircleSize + (maxCircleSize - minCircleSize) * amplitude;
			const angle = (i / values.length) * Math.PI * 2 + rotate;

			// Save the current context state
			ctx.save();

			// Translate and rotate the context to position the roundRect
			ctx.translate(centerX, centerY);
			ctx.rotate(angle);

			if (startHue !== undefined && endHue !== undefined) {
				// t goes from 0 to 1, then back to 0 (startHue to endHue back to startHue)
				let t = (i / values.length) * 2;
				if (t > 1) {
					t = 2 - t;
				}
				const hue = (startHue ?? 0) + t * hueRange;

				ctx.fillStyle = `hsl(${hue % 360}, 100%, ${varyBrightness ? 100 - Math.pow(amplitude, 0.3) * 50 : 50}%)`;
			}

			ctx.beginPath();
			ctx.ellipse(-circleSize / 2, circleHeight, circleSize / 2, circleSize / 2, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.translate(-centerX, -centerY);

			ctx.restore();
		}
	};

</script>

<div bind:clientWidth bind:clientHeight class="w-full h-full">
	<canvas bind:this={canvas} class="filter-blur-circle-circles" style="width: 100%; height: 100%"></canvas>
</div>

{#if glow}
	<svg width="0" height="0">
		<filter id="blur-and-scale-circle-circles" y="-50%" x="-50%" width="200%" height="200%">
			<feGaussianBlur in="SourceGraphic" stdDeviation={glow} result="blurred" />
			<feColorMatrix type="saturate" in="blurred" values="5" />
			<feComposite in="SourceGraphic" operator="over" />
		</filter>
	</svg>

	<style>
		.filter-blur-circle-circles {
			filter: url(#blur-and-scale-circle-circles);
		}
	</style>
{/if}
