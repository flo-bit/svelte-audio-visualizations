<script lang="ts">
	export let values:Float32Array;
	
	export let color: string | undefined = undefined;
	export let startHue: number | undefined = undefined;
	export let endHue: number | undefined = undefined;
	export let colorTopLeft: string | undefined = undefined; //= '#7c3aed';
	export let colorTopRight: string | undefined = undefined; //= '#db2777';
	export let colorBottomLeft: string | undefined = undefined; // = '#2563eb';
	export let colorBottomRight: string | undefined = undefined; //= '#dc2626';
	export let sideVisible = 5;
	export let deformation = 10;
	export let glow = 10;

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

		if (color) ctx.fillStyle = color;

		ctx.beginPath();

		const outerSize = 20;

		if (color) ctx.fillStyle = color;
		else if (startHue !== undefined && endHue !== undefined) {
			// create radial gradient
			const gradient = ctx.createLinearGradient(
				0,
				canvas.height / 3,
				canvas.width,
				(canvas.height * 2) / 3
			);
			gradient.addColorStop(0, `hsl(${startHue % 360}, 100%, 30%)`);
			gradient.addColorStop(1, `hsl(${endHue % 360}, 100%, 50%)`);
			ctx.fillStyle = gradient;
		}

		// left side
		if (color) ctx.fillStyle = color;
		else if (colorTopLeft && colorBottomLeft) {
			const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
			gradient.addColorStop(0, colorTopLeft);
			gradient.addColorStop(1, colorBottomLeft);
			ctx.fillStyle = gradient;
		}
		ctx.moveTo(0, canvas.height);
		ctx.lineTo(-outerSize, canvas.height);
		ctx.lineTo(-outerSize, 0);
		ctx.lineTo(0, 0);
		for (let i = 0; i < values.length; i++) {
			const amplitude = values[i];

			ctx.lineTo(amplitude * deformation + sideVisible, (i / values.length) * canvas.height);
		}
		ctx.fill();

		
		// bottom side
		if (color) ctx.fillStyle = color;
		else if (colorBottomLeft && colorBottomRight) {
			const gradient = ctx.createLinearGradient(0, canvas.height, canvas.width, canvas.height);
			gradient.addColorStop(0, colorBottomLeft);
			gradient.addColorStop(1, colorBottomRight);
			ctx.fillStyle = gradient;
		}
		ctx.beginPath();
		ctx.moveTo(canvas.width, canvas.height);
		ctx.lineTo(canvas.width, canvas.height + outerSize);
		ctx.lineTo(0, canvas.height + outerSize);
		ctx.lineTo(0, canvas.height);
		for (let i = 0; i < values.length; i++) {
			const amplitude = values[i];
			ctx.lineTo(canvas.width * (i / values.length), canvas.height - (amplitude * deformation + sideVisible));
		}
		ctx.fill();

		// right side
		if (color) ctx.fillStyle = color;
		else if (colorTopRight && colorBottomRight) {
			const gradient = ctx.createLinearGradient(canvas.width, 0, canvas.width, canvas.height);
			gradient.addColorStop(0, colorTopRight);
			gradient.addColorStop(1, colorBottomRight);
			ctx.fillStyle = gradient;
		}
		ctx.beginPath();
		ctx.moveTo(canvas.width, 0);
		ctx.lineTo(canvas.width + outerSize, 0);
		ctx.lineTo(canvas.width + outerSize, canvas.height);
		ctx.lineTo(canvas.width, canvas.height);
		for (let i = 0; i < values.length; i++) {
			const amplitude = values[i];

			ctx.lineTo(
				canvas.width - (amplitude * deformation + sideVisible),
				(1 - i / values.length) * canvas.height
			);
		}
		ctx.fill();

		// top side
		if (color) ctx.fillStyle = color;
		else if (colorTopLeft && colorTopRight) {
			const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
			gradient.addColorStop(0, colorTopLeft);
			gradient.addColorStop(1, colorTopRight);
			ctx.fillStyle = gradient;
		}
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(0, -outerSize);
		ctx.lineTo(canvas.width, -outerSize);
		ctx.lineTo(canvas.width, 0);
		for (let i = 0; i < values.length; i++) {
			const amplitude = values[i];
			ctx.lineTo(canvas.width * (1 - i / values.length), amplitude * deformation + sideVisible);
		}
		ctx.fill();
		
	};

</script>

<div bind:clientWidth bind:clientHeight style="height: 100%; width: 100%; filter: blur(12px)">
	<canvas bind:this={canvas} class="filter-blur-inner-glow" style="height: 100%; width: 100%;"
	></canvas>
</div>

{#if glow}
	<svg width="0" height="0">
		<filter id="blur-and-scale-inner-glow" y="-50%" x="-50%" width="200%" height="200%">
			<feGaussianBlur in="SourceGraphic" stdDeviation={glow} result="blurred" />
			<feColorMatrix type="saturate" in="blurred" values="20" />
			<feComposite in="SourceGraphic" operator="over" />
		</filter>
	</svg>

	<style>
		.filter-blur-inner-glow {
			filter: url(#blur-and-scale-inner-glow);
		}
	</style>
{/if}
