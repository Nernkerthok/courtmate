import { useEffect, useState } from "react";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstall() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
  );
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const complete = () => {
      setPrompt(null);
      setInstalled(true);
    };
    const display = window.matchMedia("(display-mode: standalone)");
    const displayChanged = () =>
      setInstalled(
        display.matches ||
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ),
      );
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", complete);
    display.addEventListener("change", displayChanged);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", complete);
      display.removeEventListener("change", displayChanged);
    };
  }, []);

  const install = async () => {
    if (!prompt || busy) return "unavailable";
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
