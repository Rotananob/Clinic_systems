import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CORE_9_ROUTES,
  TOTAL_PRIMARY_BUTTONS,
  CORE_DAILY_TOOLS_COUNT,
  EXPLORE_TOOLS_BUTTON_INDEX,
  ALL_SYSTEM_MODULE_ROUTES,
  isCoreRoute,
  calculateRemainingSpecialtyCount,
  formatDynamicExploreBadge,
  computeSidebarNavigation,
} from '../src/lib/sidebar-navigation.ts';
import { ROUTE_PERMISSIONS } from '../src/lib/rbac.ts';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('10-Button Primary Sidebar Navigation Architecture Suite', () => {
  it('should strictly enforce the 10-button navigation rule: exactly 9 core daily tool buttons plus 10th button Explore Tools', () => {
    // Exactly 9 core daily tool buttons
    assert.equal(CORE_9_ROUTES.length, 9, 'Core daily tool buttons must equal exactly 9');
    assert.equal(CORE_DAILY_TOOLS_COUNT, 9);

    // Primary buttons count must equal exactly 10
    assert.equal(TOTAL_PRIMARY_BUTTONS, 10, 'Sidebar primary navigation must have exactly 10 buttons');
    assert.equal(EXPLORE_TOOLS_BUTTON_INDEX, 10, 'The 10th button must be Explore Tools');

    // Expected exact 9 daily operational routes
    const expectedCoreRoutes = [
      '/dashboard',
      '/patients',
      '/visits',
      '/queue',
      '/prescriptions',
      '/inventory',
      '/billing',
      '/reports',
      '/settings',
    ];

    assert.deepEqual(Array.from(CORE_9_ROUTES), expectedCoreRoutes);

    for (const route of expectedCoreRoutes) {
      assert.equal(isCoreRoute(route), true, `Route ${route} must be recognized as a core route`);
    }
  });

  it('should calculate dynamic badge count of +17 tools for the 10th button when 26 modules are available', () => {
    // 26 total system modules minus 9 core daily tools = 17 specialty tools
    assert.ok(ALL_SYSTEM_MODULE_ROUTES.length >= 26, 'System must have at least 26 primary modules');
    
    const remainingCount = calculateRemainingSpecialtyCount(26, CORE_DAILY_TOOLS_COUNT);
    assert.equal(remainingCount, 17, 'Remaining count must equal 17 tools for 26 modules');

    const badgeText = formatDynamicExploreBadge(remainingCount);
    assert.equal(badgeText, '+17', 'Badge text must format as +17');
  });

  it('should preserve the 10 primary buttons and position active specialty module in contextual slot', () => {
    const mockAllowedItems = ALL_SYSTEM_MODULE_ROUTES.map((href) => ({
      href,
      label: href.replace('/', ''),
    }));

    // Case 1: When user is on a core route (/dashboard)
    const navOnDashboard = computeSidebarNavigation(mockAllowedItems, '/dashboard');
    assert.equal(navOnDashboard.coreButtons.length, 9, 'Should have exactly 9 core buttons');
    assert.equal(navOnDashboard.activeSpecialtyButton, undefined, 'No specialty button active on core route');
    assert.equal(navOnDashboard.exploreButtonPresent, true, 'Explore button must be present as 10th button');
    assert.equal(navOnDashboard.totalPrimaryCount, 10, 'Total primary buttons must equal 10');
    assert.equal(navOnDashboard.remainingToolsCount, 17, 'Remaining tools badge count must be 17');

    // Case 2: When user navigates to an advanced specialty route (/pacs)
    const navOnPacs = computeSidebarNavigation(mockAllowedItems, '/pacs');
    assert.equal(navOnPacs.coreButtons.length, 9, 'Core 9 buttons must remain intact without displacement');
    assert.ok(navOnPacs.activeSpecialtyButton, 'Specialty tool /pacs must appear in contextual active slot');
    assert.equal(navOnPacs.activeSpecialtyButton?.href, '/pacs');
    assert.equal(navOnPacs.exploreButtonPresent, true, 'Explore button must remain present');
    assert.equal(navOnPacs.totalPrimaryCount, 10, 'Total primary buttons must remain exactly 10');

    // Case 3: When user navigates to Inpatient IPD (/ipd)
    const navOnIpd = computeSidebarNavigation(mockAllowedItems, '/ipd');
    assert.equal(navOnIpd.activeSpecialtyButton?.href, '/ipd');
    assert.equal(navOnIpd.coreButtons.length, 9);
  });

  it('should verify all core 9 routes are registered in RBAC and allowed for clinical roles', () => {
    const rbacPaths = new Set(ROUTE_PERMISSIONS.map((p) => p.path));

    for (const coreRoute of CORE_9_ROUTES) {
      assert.ok(rbacPaths.has(coreRoute), `Core route ${coreRoute} must be registered in ROUTE_PERMISSIONS`);
    }

    // Settings must allow ADMIN and SUPER_ADMIN
    const settingsPerm = ROUTE_PERMISSIONS.find((p) => p.path === '/settings');
    assert.ok(settingsPerm?.allowedRoles.includes('ADMIN'));

    // Dashboard must allow DOCTOR
    const dashboardPerm = ROUTE_PERMISSIONS.find((p) => p.path === '/dashboard');
    assert.ok(dashboardPerm?.allowedRoles.includes('DOCTOR'));
  });

  it('should guarantee zero emojis across sidebar navigation labels and locale dictionary', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const [key, val] of Object.entries(en.nav)) {
      if (typeof val === 'string') {
        assert.equal(emojiRegex.test(val), false, `en.nav.${key} must not contain emojis: "${val}"`);
      }
    }

    for (const [key, val] of Object.entries(km.nav)) {
      if (typeof val === 'string') {
        assert.equal(emojiRegex.test(val), false, `km.nav.${key} must not contain emojis: "${val}"`);
      }
    }
  });

  it('should guarantee zero parentheses in Khmer text across navigation dictionary and permissions', () => {
    for (const [key, val] of Object.entries(km.nav)) {
      if (typeof val === 'string') {
        assert.equal(val.includes('('), false, `km.nav.${key} contains open parenthesis: "${val}"`);
        assert.equal(val.includes(')'), false, `km.nav.${key} contains close parenthesis: "${val}"`);
      }
    }

    for (const perm of ROUTE_PERMISSIONS) {
      assert.equal(perm.labelKh.includes('('), false, `ROUTE_PERMISSIONS labelKh contains open parenthesis: "${perm.labelKh}"`);
      assert.equal(perm.labelKh.includes(')'), false, `ROUTE_PERMISSIONS labelKh contains close parenthesis: "${perm.labelKh}"`);
      assert.equal(perm.descriptionKh.includes('('), false, `ROUTE_PERMISSIONS descriptionKh contains open parenthesis: "${perm.descriptionKh}"`);
      assert.equal(perm.descriptionKh.includes(')'), false, `ROUTE_PERMISSIONS descriptionKh contains close parenthesis: "${perm.descriptionKh}"`);
    }
  });
});
