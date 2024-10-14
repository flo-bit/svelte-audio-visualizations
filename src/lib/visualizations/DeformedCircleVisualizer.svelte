<script lang="ts">
	export let values:Float32Array;

	export let color: string | undefined = undefined;
	export let startHue: number | undefined = undefined;
	export let endHue: number | undefined = undefined;
	export let minRadius: number = 0.1;
	export let maxRadius: number = 0.4;

	let canvas: HTMLCanvasElement;
	let contentRect:DOMRectReadOnly;

	$:if(canvas && contentRect){
		const ctx = canvas.getContext('2d')!;

		//Update canvas size
		canvas.width = Math.round(contentRect.width);
		canvas.height = Math.round(contentRect.height);

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

<canvas bind:this={canvas} bind:contentRect style="filter: blur(24px);" class="w-full h-full"
></canvas>
