import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Final Kick — 3D Penalty Shootout" },
      { name: "description", content: "Final Kick: a 3D football penalty shootout game with career, tournaments and a shop." },
      { property: "og:title", content: "Final Kick — 3D Penalty Shootout" },
      { property: "og:description", content: "Step up to the spot. Swipe to shoot, dive to save." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/game/index.html"
      title="Final Kick"
      className="fixed inset-0 h-full w-full border-0"
      allow="fullscreen; autoplay"
      allowFullScreen
    />
  );
}
