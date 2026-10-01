// @ts-check
import { LocalNllbAdapter, FLORES_200_MAPPING } from './LocalNllbAdapter.js';

export { FLORES_200_MAPPING };

/**
 * LocalNllbProvider.
 * Backwards-compatible subclass of LocalNllbAdapter.
 */
export class LocalNllbProvider extends LocalNllbAdapter {
  constructor(options = {}) {
    super(options);
    this.providerId = 'nllb';
  }
}

export default LocalNllbProvider;
