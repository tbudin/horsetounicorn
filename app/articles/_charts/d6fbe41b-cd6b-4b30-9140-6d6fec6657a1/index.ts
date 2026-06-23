import type { ChartRegistry } from '@/components/article/render-blocks';
import SearchAttention from './search-attention';
import ProductionOvertake from './production-overtake';
import SupplyDemandCollision from './supply-demand-collision';
import FadVsCategory from './fad-vs-category';
import DiffusionByCountry from './diffusion-by-country';
import CategorySpread from './category-spread';
import RedditVsTrends from './reddit-vs-trends';
import AdoptionTiming from './adoption-timing';
import AlignedArcs from './aligned-arcs';
import FestiveRebound from './festive-rebound';

/** Charts registered for the pistachio-boom article. */
const registry: ChartRegistry = {
  'search-attention': SearchAttention,
  'production-overtake': ProductionOvertake,
  'supply-demand-collision': SupplyDemandCollision,
  'fad-vs-category': FadVsCategory,
  'diffusion-by-country': DiffusionByCountry,
  'category-spread': CategorySpread,
  'reddit-vs-trends': RedditVsTrends,
  'adoption-timing': AdoptionTiming,
  'aligned-arcs': AlignedArcs,
  'festive-rebound': FestiveRebound,
};

export default registry;
