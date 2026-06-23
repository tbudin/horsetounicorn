import type { ChartRegistry } from '@/components/article/render-blocks';
import WealthMultiplier from './wealth-multiplier';
import LumpSumVsDca from './lump-sum-vs-dca';
import HybridTrap from './hybrid-trap';
import SeasonalityNoise from './seasonality-noise';
import RegimeStressTest from './regime-stress-test';
import SingaporeCostLayers from './singapore-cost-layers';

/** Charts registered for the `future-money` article. */
const registry: ChartRegistry = {
  'wealth-multiplier': WealthMultiplier,
  'lump-sum-vs-dca': LumpSumVsDca,
  'hybrid-trap': HybridTrap,
  'seasonality-noise': SeasonalityNoise,
  'regime-stress-test': RegimeStressTest,
  'singapore-cost-layers': SingaporeCostLayers,
};

export default registry;
