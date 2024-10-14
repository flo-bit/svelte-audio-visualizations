<script>
	export let glow = 3;
</script>

<svg width="0" height="0">
	<filter id="blur" y="-50%" x="-50%" width="200%" height="200%">
		<feGaussianBlur in="SourceGraphic" stdDeviation={glow} result="blurred" />
		<feColorMatrix type="saturate" in="blurred" values="5" />
		<feComposite in="SourceGraphic" operator="over" />
	</filter>
</svg>
<div class="w-full h-full" style="filter: url(#blur);">
	<slot />
</div>