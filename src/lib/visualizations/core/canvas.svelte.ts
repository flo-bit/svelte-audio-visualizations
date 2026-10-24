export type CanvasDraw = (context: CanvasRenderingContext2D, width: number, height: number) => void;

/** Resize backing storage only on size/DPR changes; all drawing uses CSS pixels. */
export function canvasSurface(
	getCanvas: () => HTMLCanvasElement | undefined,
	getMaxPixelRatio: () => number
) {
	let width = $state(0);
	let height = $state(0);
	let ratio = $state(1);

	$effect(() => {
		const canvas = getCanvas();
		const cap = getMaxPixelRatio();
		if (!canvas) return;
		let resolution: MediaQueryList;
		function resize() {
			if (!canvas) return;
			const bounds = canvas.getBoundingClientRect();
			width = Math.max(0, bounds.width);
			height = Math.max(0, bounds.height);
			ratio = Math.max(0.5, Math.min(window.devicePixelRatio || 1, Number.isFinite(cap) ? cap : 2));
			const pixelWidth = Math.round(width * ratio);
			const pixelHeight = Math.round(height * ratio);
			if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
			if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
		}
		function watchResolution() {
			resolution?.removeEventListener('change', watchResolution);
			resolution = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
			resolution.addEventListener('change', watchResolution);
			resize();
		}
		const observer = new ResizeObserver(resize);
		observer.observe(canvas);
		window.addEventListener('resize', resize);
		watchResolution();
		return () => {
			observer.disconnect();
			resolution.removeEventListener('change', watchResolution);
			window.removeEventListener('resize', resize);
		};
	});

	return {
		draw(render: CanvasDraw) {
			const canvas = getCanvas();
			const w = width;
			const h = height;
			const dpr = ratio;
			if (!canvas || !w || !h) return;
			const context = canvas.getContext('2d');
			if (!context) return;
			context.setTransform(dpr, 0, 0, dpr, 0, 0);
			context.clearRect(0, 0, w, h);
			context.save();
			try {
				render(context, w, h);
			} finally {
				context.restore();
			}
		}
	};
}
