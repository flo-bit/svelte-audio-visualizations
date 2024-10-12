# svelte audio visualizations

simple, zero dependency audio visualizations for svelte, especially useful for visualizing voice input and output.

https://github.com/user-attachments/assets/056b0226-75e2-438f-82a1-cfbc7aace468

## Installation

copy the `lib/visualizations` folder into your project.

## Usage

All visualizations expect some props to be passed to them.

The one required prop is `audioInput`, which can be either of type `WavRecorder`, `WavStreamPlayer` or `AudioFilePlayer` or a function that returns a normalized (between 0-1) Float32Array of the current frequency data. for other props, see the individual visualizations.

see the `src/routes/+page.svelte` file for an example of how to use the visualizations.

## Credits

originally built for [svelte-realtime-api](https://github.com/flo-bit/svelte-openai-realtime-api) with lots of code adjusted from [openai-realtime-console](https://github.com/openai/openai-realtime-console), including the WavRecorder and WavStreamPlayer classes.

## License

MIT
