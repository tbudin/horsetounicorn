import type { ChartRegistry } from '@/components/article/render-blocks';
import SearchVsFertility from './search-vs-fertility';
import BreastfeedingSeasonality from './breastfeeding-seasonality';
import ParentalSearchMomentum from './parental-search-momentum';
import FormulaBrandSearch from './formula-brand-search';
import August2025CategoryLift from './august-2025-category-lift';
import InfantToddlerThreeWaves from './infant-toddler-three-waves';
import AutismNewsSurge from './autism-news-surge';
import BrandResponseTimeline from './brand-response-timeline';

/** Charts registered for the `early-life-nutrition` article. */
const registry: ChartRegistry = {
  'search-vs-fertility': SearchVsFertility,
  'breastfeeding-seasonality': BreastfeedingSeasonality,
  'parental-search-momentum': ParentalSearchMomentum,
  'formula-brand-search': FormulaBrandSearch,
  'august-2025-category-lift': August2025CategoryLift,
  'infant-toddler-three-waves': InfantToddlerThreeWaves,
  'autism-news-surge': AutismNewsSurge,
  'brand-response-timeline': BrandResponseTimeline,
};

export default registry;
