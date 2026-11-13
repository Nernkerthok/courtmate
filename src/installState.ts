export const appDisplayModes = [
  "standalone",
  "minimal-ui",
  "window-controls-overlay",
] as const;

export function isAppWindow(
  matchMedia: (query: string) => { matches: boolean },
  iosStandalone = false,
): boolean {
  return (
    iosStandalone ||
    appDisplayModes.some(
      (mode) => matchMedia(`(display-mode: ${mode})`).matches,
    )
  );
}
