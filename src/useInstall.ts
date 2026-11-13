import { useEffect, useRef, useState } from "react";
import { appDisplayModes, isAppWindow } from "./installState";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstall() {
  const inApp = () =>
    isAppWindow(
      (query) => window.matchMedia(query),
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    );
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(inApp);
  const confirmed = useRef(installed);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      if (confirmed.current || inApp()) {
        setPrompt(null);
        setInstalled(true);
      } else setPrompt(event as InstallPrompt);
    };
    const complete = () => {
      setPrompt(null);
      confirmed.current = true;
      setInstalled(true);
    };
    const displays = appDisplayModes.map((mode) =>
      window.matchMedia(`(display-mode: ${mode})`),
    );
    const displayChanged = () => {
      if (inApp()) confirmed.current = true;
      const active = confirmed.current || inApp();
      setInstalled(active);
      if (active) setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", complete);
    displays.forEach((display) =>
      display.addEventListener("change", displayChanged),
    );
    window.addEventListener("pageshow", displayChanged);
    window.addEventListener("focus", displayChanged);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", complete);
      displays.forEach((display) =>
        display.removeEventListener("change", displayChanged),
      );
      window.removeEventListener("pageshow", displayChanged);
      window.removeEventListener("focus", displayChanged);
    };
  }, []);

  const install = async () => {
    if (!prompt || busy || installed || inApp()) return "unavailable";
    setBusy(true);
    setPrompt(null); // A browser install prompt can only be used once.
    try {
      await prompt.prompt();
      return (await prompt.userChoice).outcome;
    } catch {
      return "failed";
    } finally {
      setBusy(false);
    }
  };
  return { available: Boolean(prompt), installed, busy, install };
}
