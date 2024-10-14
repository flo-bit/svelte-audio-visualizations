# svelte audio visualizations

simple, zero dependency audio visualizations for svelte, especially useful for visualizing voice input and output.

https://github.com/user-attachments/assets/056b0226-75e2-438f-82a1-cfbc7aace468

## Installation

copy the `lib/visualizations` folder into your project.

## Usage

There are two ways you can use the visualizations:

1. Using with a `WavRecorder`, `WavStreamPlayer` or `AudioFilePlayer` instance. For this use the components in the `lib/visualizations/audio` folder ending with `AudioVisualizer`.

```svelte
<script lang="ts">
	import { AudioFilePlayer } from '$lib/visualizations/wavtools';

    let audio: AudioFilePlayer | null = null;

    function playMusic() {
		audio = new AudioFilePlayer();
		audio.loadFile('/svelte-audio-visualizations/music.mp3').then(() => audio.play());
    }
</script>

<button on:click={playMusic}>Play music</button>

{#if audio}
    <CircleBarAudioVisualizer {audio} />
{/if}
```

2. Passing in values yourself. For this use the components in the `lib/visualizations/core` folder. Ending just in `Visualizer`.

```svelte
<script lang="ts">
	import DeformedCircleVisualizer from '$lib/visualizations/core/DeformedCircleVisualizer.svelte';
</script>

<CircleBarVisualizer values={new Float32Array([0, 1, 0, 1, 0, 1])} />
```

For this a normalized Float32Array is expected, where each value is between 0 and 1. Also note, that the length of the array influences the visualizations (e.g. number of bars in the `BarVisualizer`). To convert from any length array, to a specific length, you can use the `normalizeArray` function.

```ts
import { normalizeArray } from '$lib/visualizations/core/utils';

const values = new Float32Array([0, 1, 0, 1, 0, 1]);

const normalizedValues = normalizeArray(values, 10);
```


## Credits

originally built for [svelte-realtime-api](https://github.com/flo-bit/svelte-openai-realtime-api) with lots of code adjusted from [openai-realtime-console](https://github.com/openai/openai-realtime-console), including the WavRecorder and WavStreamPlayer classes.

## License

MIT
