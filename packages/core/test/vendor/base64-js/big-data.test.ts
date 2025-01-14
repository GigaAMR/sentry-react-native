// The MIT License (MIT)

// Copyright (c) 2014 Jameson Little

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// Adapted from https://github.dev/beatgammit/base64-js/blob/88957c9943c7e2a0f03cdf73e71d579e433627d3/test/big-data.js#L4

import { base64StringFromByteArray } from '../../../src/js/vendor';

describe('base64-js', () => {
  // eslint-disable-next-line @sentry-internal/sdk/no-skipped-tests
  test.skip('convert big data to base64', () => {
    const SIZE_2MB = 2e6; // scaled down from original 64MiB
    const big = new Uint8Array(SIZE_2MB);
    for (let i = 0, length = big.length; i < length; ++i) {
      big[i] = i % 256;
    }
    const b64str = base64StringFromByteArray(big);
    const arr = Uint8Array.from(Buffer.from(b64str, 'base64'));
    expect(arr).toEqual(big);
  });
});
