"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallStoreApp({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const manifestId = `store-manifest-${slug}`;
    if (!document.getElementById(manifestId)) {
      const link = document.createElement("link");
      link.id = manifestId;
      link.rel = "manifest";
      link.href = `/s/${encodeURIComponent(slug)}/manifest.webmanifest`;
      document.head.appendChild(link);
    }
    void navigator.serviceWorker?.register("/s/store-app-worker.js", {
      scope: "/s/",
    });
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [slug]);
  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }
  return (
    <section className="sf-app-install">
      <div>
        <p className="sf-eyebrow">PRO STORE APP</p>
        <h2>{name}, ready on a home screen.</h2>
        <p>
          Install this store for a full-screen, app-like shopping experience.
          Orders, messages and the catalogue stay in one familiar place.
        </p>
      </div>
      {prompt ? (
        <button className="sf-cta" onClick={install}>
          <Download size={16} /> Install store app
        </button>
      ) : (
        <small>
          {installed
            ? "Store app installed on this device."
            : "Use your browser menu to add this store to your home screen."}
        </small>
      )}
    </section>
  );
}
