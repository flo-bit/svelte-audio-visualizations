<script lang="ts">
	import { amplitude } from './utils';
	interface Props {
		value: number;
		color?: string;
		backgroundColor?: string;
		accentColor?: string;
	}
	let {
		value,
		color = '#f59e0b',
		backgroundColor = '#78350f',
		accentColor = color
	}: Props = $props();
	const maskId = $props.id();
</script>

<svg viewBox="0 0 24 24" aria-hidden="true" style="height: 100%; width: 100%;">
	<mask id={maskId}>
		<rect x="0" y="0" width="24" height="24" fill="white" />
		<rect x="0" y="0" width="24" height={0.75 + (1 - amplitude(value)) * 15.75} fill="black" />
	</mask>
	<path
		d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z"
		fill={backgroundColor}
	/>
	<path
		mask={`url(#${maskId})`}
		d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z"
		fill={accentColor}
	/>
	<path
		d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z"
		fill={color}
	/>
</svg>
