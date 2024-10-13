<script lang="ts">
	export let values:Float32Array;

	export let color: string | undefined = undefined;
	export let startHue: number | undefined = undefined;
	export let endHue: number | undefined = undefined;
	export let minRadius: number = 0.1;
	export let maxRadius: number = 0.4;
	export let glow = 20;

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

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
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

		for (let i = 0; i <= values.length; i++) {
			const angle = (i / values.length) * Math.PI * 2;
			const currentAmplitude = values[i % values.length];

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


</script>

<div bind:clientWidth bind:clientHeight style="width: 100%; height: 100%; filter: blur(24px);">
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
