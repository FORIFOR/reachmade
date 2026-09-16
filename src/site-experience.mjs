/** Public interface for page copy and entry points. Original copy remains separate. */
import { productNavigation as originalNavigation } from './site-content.mjs';
import { landingIds, landingRoute } from './product-landings.mjs';
export { improveCopy, contactDestination, productIndex, caseStudies, serviceExamples, profileProof } from './site-content.mjs';
export function productNavigation(product, language) {
  const result = originalNavigation(product, language);
  if (landingIds.includes(product.id)) result.site = `https://reachmade.com${landingRoute(product.id,language)}`;
  // The retained original Genie site names its demo section #demos, not #demo.
  if (product.id === 'genie') result.demo = result.demo.replace(/#demo$/, '#demos');
  return result;
}
