import { describe, it, expect } from 'vitest';
import { generateProductCode } from '../../../src/modules/product/product.utils.js';

describe('Product Utils - generateProductCode', () => {
    it('should generate a code with correct prefix length', () => {
        const code = generateProductCode('Test Widget');
        const [prefix] = code.split('-');
        expect(prefix.length).toBe(7);
    });

    it('should extract increasing substrings correctly', () => {
        // 'abc' is increasing, indices 0,1,2
        const code = generateProductCode('abc');
        // md5(abc) start is '9001509'
        // indices 0 and 2
        expect(code).toContain('0abc2');
    });

    it('should handle spaces and casing', () => {
        const code1 = generateProductCode('Test Widget');
        const code2 = generateProductCode('testwidget');
        // The substring logic works on sanitized name
        const parts1 = code1.split('-');
        const parts2 = code2.split('-');
        expect(parts1[1]).toBe(parts2[1]);
    });
});
