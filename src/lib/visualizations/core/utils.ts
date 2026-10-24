/** Clamp a normalized amplitude, treating non-finite input as silence. */
export function amplitude(value: number): number {
	return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

/**
 * Resample normalized values using average/peak downsampling or linear interpolation.
 * This changes the number of samples, not their amplitude range. An optional output
 * buffer avoids allocations. Empty input produces silence; invalid sizes throw.
 */
export function resampleValues(
	data: ArrayLike<number>,
	size: number,
	mode: 'average' | 'peak' = 'average',
	output = new Float32Array(validSize(size))
): Float32Array {
	validSize(size);
	if (output.length !== size) throw new RangeError('Output length must match size');
	if (output === data) throw new TypeError('Input and output must be different buffers');
	output.fill(0);
	const n = data.length;
	if (!n || !size) return output;
	if (size <= n) {
		for (let i = 0; i < size; i++) {
			const start = Math.floor((i * n) / size);
			const end = Math.floor(((i + 1) * n) / size);
			let value = 0;
			for (let j = start; j < end; j++) {
				const sample = amplitude(data[j]);
				value = mode === 'peak' ? Math.max(value, sample) : value + sample;
			}
			output[i] = mode === 'peak' ? value : value / (end - start);
		}
	} else {
		for (let i = 0; i < size; i++) {
			const position = (i * (n - 1)) / (size - 1);
			const low = Math.floor(position);
			const t = position - low;
			output[i] = amplitude(data[low]) * (1 - t) + amplitude(data[Math.min(low + 1, n - 1)]) * t;
		}
	}
	return output;
}

function validSize(size: number): number {
	if (!Number.isInteger(size) || size < 0)
		throw new RangeError('Size must be a non-negative integer');
	return size;
}
