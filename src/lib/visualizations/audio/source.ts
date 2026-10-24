import type { AudioSource } from './types';

interface MediaConnection {
	context: AudioContext;
	node: MediaElementAudioSourceNode;
}

// The platform permits only one MediaElementAudioSourceNode per element, ever.
// Keep its playback route alive when a visualization is removed or replaced.
const mediaConnections = new WeakMap<HTMLMediaElement, MediaConnection>();

function mediaConnection(element: HTMLMediaElement): MediaConnection {
	let connection = mediaConnections.get(element);
	if (!connection) {
		const context = new AudioContext();
		try {
			const node = context.createMediaElementSource(element);
			node.connect(context.destination);
			connection = { context, node };
			mediaConnections.set(element, connection);
		} catch (error) {
			void context.close().catch(() => {});
			throw error;
		}
	}
	return connection;
}

/** Call from a click/tap before play() to satisfy browser autoplay rules. */
export async function resumeAudio(source: AudioSource): Promise<void> {
	const context =
		source instanceof HTMLMediaElement
			? mediaConnection(source).context
			: source instanceof AnalyserNode
				? source.context
				: undefined;
	if (context instanceof AudioContext && context.state === 'suspended') await context.resume();
}

/** Attach only an analysis tap. Never stop caller-owned tracks or reroute borrowed nodes. */
export function connectSource(source: AudioSource) {
	if (source instanceof AnalyserNode) {
		// A visualization must not start an application-owned audio graph on mount.
		return { analyser: source, resume: () => Promise.resolve(), dispose() {} };
	}
	const media = source instanceof HTMLMediaElement;
	const connection = media ? mediaConnection(source) : undefined;
	const context = connection?.context ?? new AudioContext();
	let node: AudioNode;
	let analyser: AnalyserNode;
	try {
		node = connection?.node ?? context.createMediaStreamSource(source as MediaStream);
		analyser = context.createAnalyser();
		analyser.fftSize = 2048;
		// Smoothing is frame-rate independent and handled in analysis.ts.
		analyser.smoothingTimeConstant = 0;
		node.connect(analyser);
		// No connection to speakers for MediaStream: never monitor the mic by default.
	} catch (error) {
		if (!media) void context.close().catch(() => {});
		throw error;
	}
	let disposed = false;
	return {
		analyser,
		async resume() {
			if (!disposed && context.state === 'suspended') await context.resume();
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			node.disconnect(analyser);
			analyser.disconnect();
			if (!media) void context.close().catch(() => {});
		}
	};
}
