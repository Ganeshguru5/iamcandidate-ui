import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "knot",
    short_name: "knot",
    description: "A personal command center for documents, job search, communication and knowledge.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#fcfbf8",
    theme_color: "#fcfcfd",
    categories: ["productivity", "business"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Applications", url: "/career/applications" },
      { name: "Tasks", url: "/workspace/tasks" },
      { name: "Board", url: "/workspace/board" },
    ],
  }
}
