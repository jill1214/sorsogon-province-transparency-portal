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
  operator: { name: 'Independent Civic Initiative' },
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
