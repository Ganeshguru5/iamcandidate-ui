import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "IamCandidate",
    short_name: "IamCandidate",
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
    // "Share → IamCandidate" on Android: the shared link or text opens in Chat (iOS
    // has no share targets for web apps; a Shortcut can open the same URL).
    share_target: {
      action: "/career/chat",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
    shortcuts: [
      { name: "Chat", url: "/career/chat" },
      { name: "Applications", url: "/career/applications" },
      { name: "Tasks", url: "/workspace/tasks" },
      { name: "Board", url: "/workspace/board" },
    ],
  }
}
