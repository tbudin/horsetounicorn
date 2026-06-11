import type { ChartRegistry } from '@/components/article/render-blocks';
import WealthMultiplier from './wealth-multiplier';

/** Charts registered for the `future-money` article. */
const registry: ChartRegistry = {
  'wealth-multiplier': WealthMultiplier,
};

export default registry;
