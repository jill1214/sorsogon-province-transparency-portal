/**
 * Sorsogon Province FY2027 budget transparency portal.
 * Based on the BetterGov.PH public Budget API.
 *
 * DPWH offices and legislative districts were verified against the live API.
 * Office coverage is not proof of project-level municipal or barangay location.
 * Validate against the live API with `npm run check` before deployment.
 */
import { defineConfig } from './src/config';

export default defineConfig({
  id: 'sorsogon-province',
  kind: 'province',
  name: 'Province of Sorsogon',
  shortName: 'Sorsogon',
  siteUrl: 'https://sorsogon-province-transparency-portal.vercel.app/',
  operator: { name: 'Independent Civic Initiative', email: 'budget.transparency.portal4700@gmail.com' },
  scope: {
    offices: [
      'Sorsogon District Engineering Office',
      'Sorsogon 2nd District Engineering Office',
    ],
    places: [{ label: 'Sorsogon', q: 'Sorsogon', region: 'V' }],
    districts: ['leg:sorsogon:1st', 'leg:sorsogon:2nd'],
    exclude: [],
  },
  reporting: { enabled: false },
});
