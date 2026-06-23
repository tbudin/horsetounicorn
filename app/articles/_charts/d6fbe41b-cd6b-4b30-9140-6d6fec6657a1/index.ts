import type { ChartRegistry } from '@/components/article/render-blocks';
import SearchAttention from './search-attention';
import ProductionOvertake from './production-overtake';
import SupplyDemandCollision from './supply-demand-collision';
import FadVsCategory from './fad-vs-category';

/** Charts registered for the pistachio-boom article. */
const registry: ChartRegistry = {
  'search-attention': SearchAttention,
  'production-overtake': ProductionOvertake,
  'supply-demand-collision': SupplyDemandCollision,
  'fad-vs-category': FadVsCategory,
};

export default registry;
