import { describe, expect, it } from 'vitest';
import { amplitude, resampleValues } from '../../src/lib/visualizations/core/utils';

describe('resampleValues', () => {
	it('averages or keeps peaks when downsampling', () => {
		expect([...resampleValues([0, 1, 0.5, 0.5], 2)]).toEqual([0.5, 0.5]);
		expect([...resampleValues([0, 1, 0.5, 0.5], 2, 'peak')]).toEqual([1, 0.5]);
	});
	it('interpolates when upsampling, including singleton input', () => {
		expect([...resampleValues([0, 1], 5)]).toEqual([0, 0.25, 0.5, 0.75, 1]);
		expect([...resampleValues([0.5], 3)]).toEqual([0.5, 0.5, 0.5]);
	});
	it('handles empty input and zero output size', () => {
		expect([...resampleValues([], 3)]).toEqual([0, 0, 0]);
		expect([...resampleValues([1], 0)]).toEqual([]);
		expect([...resampleValues([], 0)]).toEqual([]);
	});
	it('keeps data finite and bounded', () => {
		expect([...resampleValues([NaN, Infinity, -1, 2], 4)]).toEqual([0, 0, 0, 1]);
		expect(amplitude(-Infinity)).toBe(0);
	});
	it('reuses caller buffers without stale memoization', () => {
		const input = new Float32Array([0, 1]);
		const output = new Float32Array(1);
		expect(resampleValues(input, 1, 'average', output)).toBe(output);
		expect(output[0]).toBe(0.5);
		input.fill(1);
		resampleValues(input, 1, 'average', output);
		expect(output[0]).toBe(1);
	});
	it('rejects invalid dimensions and in-place resampling', () => {
		for (const size of [-1, 0.5, NaN, Infinity])
			expect(() => resampleValues([], size)).toThrow(RangeError);
		expect(() => resampleValues([], 3, 'average', new Float32Array(2))).toThrow(RangeError);
		const input = new Float32Array(2);
		expect(() => resampleValues(input, 2, 'average', input)).toThrow(TypeError);
	});
});
