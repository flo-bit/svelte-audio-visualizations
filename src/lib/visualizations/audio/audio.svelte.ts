import { createAnalysis } from './analysis';
import { connectSource } from './source';
import type { AudioFrame, AudioProps } from './types';

/** Component-local lifecycle and animation loop; no provider or shared scheduler. */
export function useAudio(getProps: () => AudioProps) {
	let frame = $state.raw<AudioFrame>({ values: new Float32Array(32), level: 0 });
	let connection = $state.raw<ReturnType<typeof connectSource>>();

	$effect(() => {
		const { source, active = true, onerror } = getProps();
		if (!source || !active) {
			connection = undefined;
			return;
		}
		try {
			const next = connectSource(source);
			let disposed = false;
			connection = next;
			void next.resume().catch((error: unknown) => {
				if (!disposed) onerror?.(asError(error));
			});
			return () => {
				disposed = true;
				next.dispose();
			};
		} catch (error) {
			connection = undefined;
			onerror?.(asError(error));
		}
	});

	$effect(() => {
		const {
			preset,
			bands,
			minFrequency,
			maxFrequency,
			scale,
			minDecibels,
			maxDecibels,
			gain,
			attack,
			release,
			fps = 60,
			respectReducedMotion = true,
			onerror
		} = getProps();
		const current = connection;
		const size = Number.isInteger(bands) && bands! > 0 && bands! <= 2048 ? bands! : 32;
		frame = { values: new Float32Array(size), level: 0 };
		if (!current) return;
		let reader: ReturnType<typeof createAnalysis>;
		try {
			if (!Number.isFinite(fps) || fps <= 0)
				throw new RangeError('fps must be positive and finite');
			reader = createAnalysis(current.analyser, {
				preset,
				bands,
				minFrequency,
				maxFrequency,
				scale,
				minDecibels,
				maxDecibels,
				gain,
				attack,
				release
			});
		} catch (error) {
			onerror?.(asError(error));
			return;
		}

		// Alternate stable buffers so Svelte observes a new value reference each frame.
		// No array allocation or deep proxying in the frame loop.
		const buffers = [new Float32Array(size), new Float32Array(size)];
		let bufferIndex = 0;
		let request = 0;
		let lastTime = -Infinity;
		let stopped = false;
		const motion = matchMedia('(prefers-reduced-motion: reduce)');
		const context = current.analyser.context;

		function running() {
			return !stopped && !document.hidden && context.state === 'running';
		}
		function tick(time: number) {
			request = 0;
			if (!running()) return;
			const rate = respectReducedMotion && motion.matches ? Math.min(fps, 10) : fps;
			if (time - lastTime >= 1000 / rate - 0.5) {
				try {
					const result = reader.read(time);
					const values = buffers[bufferIndex];
					bufferIndex = 1 - bufferIndex;
					values.set(result.values);
					frame = { values, level: result.level };
					lastTime = time;
				} catch (error) {
					stopped = true;
					onerror?.(asError(error));
					return;
				}
			}
			request = requestAnimationFrame(tick);
		}
		function update() {
			cancelAnimationFrame(request);
			request = 0;
			lastTime = -Infinity;
			if (running()) request = requestAnimationFrame(tick);
			else frame = { values: reader.reset().values, level: 0 };
		}
		document.addEventListener('visibilitychange', update);
		context.addEventListener('statechange', update);
		update();
		return () => {
			stopped = true;
			cancelAnimationFrame(request);
			document.removeEventListener('visibilitychange', update);
			context.removeEventListener('statechange', update);
		};
	});

	return {
		get frame() {
			return frame;
		}
	};
}

function asError(error: unknown): Error {
	return error instanceof Error ? error : new Error(String(error));
}
