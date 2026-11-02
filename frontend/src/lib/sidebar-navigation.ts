/**
 * 10-Button Primary Sidebar Navigation Architecture
 * Strictly maintains exactly 9 core daily tool buttons plus 10th button Explore Tools
 * with dynamic count badge +17 Tools / 26+ Modules.
 */

export const CORE_9_ROUTES = [
  '/dashboard',
  '/patients',
  '/visits',
  '/queue',
  '/prescriptions',
  '/inventory',
  '/billing',
  '/reports',
  '/settings',
] as const;

export type CoreRoute = (typeof CORE_9_ROUTES)[number];

export const TOTAL_PRIMARY_BUTTONS = 10;
export const CORE_DAILY_TOOLS_COUNT = 9;
export const EXPLORE_TOOLS_BUTTON_INDEX = 10;

export const ALL_SYSTEM_MODULE_ROUTES = [
  '/dashboard',
  '/patients',
  '/visits',
  '/queue',
  '/prescriptions',
  '/inventory',
  '/billing',
  '/reports',
  '/certificates',
  '/follow-ups',
  '/documents',
  '/pacs',
  '/insurance',
  '/concierge',
  '/signage',
  '/lab',
  '/ipd',
  '/finance',
  '/dental',
  '/teleconsult',
  '/eclaim',
  '/narcotics',
  '/fleet-sync',
  '/infusion',
  '/staff',
  '/super-admin',
  '/owner',
  '/invoice-template',
  '/settings',
] as const;

export function isCoreRoute(path: string): boolean {
  return CORE_9_ROUTES.some((core) => core === path);
}

export function calculateRemainingSpecialtyCount(
  totalModulesCount: number,
  coreCount: number = CORE_DAILY_TOOLS_COUNT,
): number {
  return Math.max(0, totalModulesCount - coreCount);
}

export function formatDynamicExploreBadge(remainingCount: number): string {
  return `+${remainingCount}`;
}

export function computeSidebarNavigation<T extends { href: string }>(
  allowedItems: T[],
  currentPath: string,
): {
  coreButtons: T[];
  activeSpecialtyButton: T | undefined;
  exploreButtonPresent: boolean;
  totalPrimaryCount: number;
  remainingToolsCount: number;
} {
  const coreButtons = allowedItems.filter((item) => isCoreRoute(item.href));
  const activeSpecialtyButton = allowedItems.find(
    (item) =>
      !isCoreRoute(item.href) &&
      (currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href))),
  );
  const remainingToolsCount = Math.max(0, allowedItems.length - CORE_9_ROUTES.length);

  return {
    coreButtons,
    activeSpecialtyButton,
    exploreButtonPresent: true,
    totalPrimaryCount: coreButtons.length + 1,
    remainingToolsCount,
  };
}
