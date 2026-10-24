# Svelte audio visualizations

simple, zero dependency audio visualizations for svelte 5, especially useful for visualizing voice input and output.

https://github.com/user-attachments/assets/056b0226-75e2-438f-82a1-cfbc7aace468

## Installation

Copy `src/lib/visualizations` into your project. Requires Svelte 5.20+; works with SSR.

- `audio/`: visualize an audio/video element, `MediaStream` or `AnalyserNode`.
- `core/`: render values you supply.

**Give the parent a width and height.** Components fill the available space.

## Audio

```svelte
<script lang="ts">
	import BarAudioVisualizer from '$lib/visualizations/audio/BarAudioVisualizer.svelte';
	import { resumeAudio } from '$lib/visualizations/audio/source';

	let player = $state<HTMLAudioElement>();

	async function play() {
		if (!player) return;
		await resumeAudio(player);
		await player.play();
	}
</script>

<audio bind:this={player} src="/music.mp3"></audio>
<button onclick={play}>Play</button>
<button onclick={() => player?.pause()}>Pause</button>
<div style="height: 160px;">
	<BarAudioVisualizer source={player} bands={32} color="#f59e0b" />
</div>
```

For a microphone or WebRTC stream, pass the stream instead:

```svelte
<BarAudioVisualizer source={stream} preset="voice" />
```

Get microphone audio with `navigator.mediaDevices.getUserMedia({ audio: true })` (HTTPS or localhost required). Stop its tracks when you're done. See [the demo](src/routes/+page.svelte) for an example.

If you already use Web Audio, pass your analyser as `source`. Playback and recording stay under your control.

## Your own values

Core components accept arrays of values between 0 and 1:

```svelte
<script lang="ts">
	import BarVisualizer from '$lib/visualizations/core/BarVisualizer.svelte';

	let values = $state([0, 0.2, 0.8, 0.3, 1]);
</script>

<div style="height: 160px;"><BarVisualizer {values} /></div>
```

The array length controls the number of bars or points. Typed arrays work too; assign a new reference when updating them. `resampleValues(values, count)` from `core/utils` changes the number of samples.

## Customization

Swap `Bar` for `CircleBar`, `CircleCircles`, `DeformedCircle`, `InnerGlow`, `Microphone` or `Speaker` in the component name. Core microphone/speaker icons take a single `value` instead of `values`.

Common options:

- `color`, or `startHue` / `endHue` for a gradient.
- `bands` for detail, `preset="voice"` or `"music"` for audio analysis.
- `gain` for sensitivity, `attack` / `release` for smoothing.
- `glow` on audio components, off by default. `blur` on deformed-circle/inner-glow components.
- `fps` and `maxPixelRatio` to reduce rendering cost.

See the [components](src/lib/visualizations) for visual-specific props and [audio/types.ts](src/lib/visualizations/audio/types.ts) for all audio options.

## License

MIT
