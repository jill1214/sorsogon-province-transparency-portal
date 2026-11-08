# SPT Portal GA4 tracking

This is a local website collection adapter, independent of any reusable GA4 MCP integration.

- GA4 Measurement ID: `G-55F4BY0YQ8`, public identifier (not a secret)
- Production host: `sorsogon-province-transparency-portal.vercel.app`
- **Preview and localhost never load the Google tag or transmit events.**
- No GTM container, additional npm package, environment variable, backend, or database.
- No raw internal search terms, filter values, user IDs, document URLs, or query strings in custom event parameters.

## Production release prerequisite: GA4 stream setting

**Before merging/deploying this PR**, in GA4 property for SPT Portal:
Admin > Data streams > SPT Portal Website > Enhanced measurement (gear)
> Page views > Show advanced settings:
**disable "Page changes based on browser history events".**
Keep Page loads disabled if the setting permits, or verify the `send_page_view:false` configuration suppresses the initial automatically generated load pageview. This is required because this implementation emits manual `page_view` events once per pathname transition, with query strings omitted. Google's enhanced automatic history measurement is independent of `send_page_view:false`, and can duplicate views for each search/filter URL update.

Also review automatic **Site search** enhanced measurement and disable it for this stream to avoid sending raw query parameter `q` as `search_term`. Other automatic events can be kept after confirming parameters do not carry personal information.

## Events

| Event | Trigger | Custom parameters |
| --- | --- | --- |
| `page_view` | Initial route and pathname changes only | `page_location` (clean path), `page_title`, `page_type` |
| `view_project` | Enter a project detail route | `project_dataset` |
| `filter_projects` | Change a non-search filter | `section`, `filter_type` |
| `search` | Press Enter with a non-empty search query | `section` only (never the term) |
| `download_csv` | Start a CSV export | `section` |
| `source_link_click` | Click a BetterGov.PH outbound link | `source_domain` only |

Do not mark these as conversions/key events without a specific reporting objective. Event counts are distinct from unique users or completed downloads.

## Validation

1. Run existing repository CI plus `npx tsx --test tests/analytics.test.ts`.
2. Inspect protected Preview and verify **no** `gtag/js` network load, no GA4 requests, and no `dataLayer` from this adapter.
3. Once authorized for Production, verify exactly one `page_view` event per route navigation and **no** `page_view` increase when only the search query/filter or hash changes. Test with GA4 DebugView (optionally via Chrome Tag Assistant) and browser Network.
4. Confirm page views for `/`, `/gaa`, `/about` and one project; verify the permitted custom events and that no URL query parameter or actual search term is transmitted.
5. Ensure notices/privacy disclosure are appropriate for analytics collection before Production release. Monitor tag consent requirements and local privacy policy.

The tag is inserted only after React starts on the exact public host. Static SEO HTML remains crawlable and unaffected.


## Visitor permission and deployment prerequisites

The website now includes an optional analytics accept/decline control and a privacy section at `/about#analytics-privacy`. GA4 must not load until a visitor chooses Accept. The decision persists in browser storage, and visitors may reopen preferences using the footer. Declining after acceptance disables collection and reloads the website. Preview and localhost remain tracking-disabled regardless of choice.

Production checklist:
- The operator approved the public contact budget.transparency.portal4700@gmail.com; check that it appears in the portal footer and About privacy notice. Review the GA4 property retention setting and disclosure wording before release.
- Keep GA4 automatic Site search and history-based Page views disabled.
- Review and preferably disable automatic Outbound clicks and any other Enhanced Measurement events that could reveal query strings or full document URLs. Our custom events deliberately omit those values.
- Validate protected Preview in a real browser: accepting must not load a GA4 script or send collect requests.
- With separate authorization for Production, verify no analytics before consent, no analytics after decline, exactly one page view per pathname navigation after acceptance, and no sensitive search query parameters sent.
- Run the existing CI and check preservation of BetterGov attribution, original disclaimers, and SEO static pages.

Unit tests prove logic and compile behavior, not complete browser-level privacy protection. Do not merge or release until the remaining verification and operator contact questions are resolved.
