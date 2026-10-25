import type { Metadata } from "next"

type StartupImage = Extract<NonNullable<Metadata["appleWebApp"]>, object>["startupImage"]

// iOS only shows a launch screen whose size exactly matches the device, so
// each one needs its own media query. [CSS width, CSS height, pixel ratio],
// portrait. Rendered by scripts/generate-pwa-assets.mjs — keep the two in sync.
const DEVICES: [number, number, number][] = [
  [440, 956, 3], // iPhone 16/17 Pro Max
  [420, 912, 3], // iPhone Air
  [430, 932, 3], // iPhone 14 Pro Max, 15/16 Plus, 15 Pro Max
  [402, 874, 3], // iPhone 16/17 Pro, 17
  [393, 852, 3], // iPhone 14 Pro, 15, 15 Pro, 16
  [428, 926, 3], // iPhone 12/13 Pro Max, 14 Plus
  [390, 844, 3], // iPhone 12, 13, 14, 12/13 Pro, 16e
  [375, 812, 3], // iPhone X, XS, 11 Pro, 12/13 mini
  [414, 896, 3], // iPhone XS Max, 11 Pro Max
  [414, 896, 2], // iPhone XR, 11
  [414, 736, 3], // iPhone 8 Plus
  [375, 667, 2], // iPhone SE 2/3, 8
  [320, 568, 2], // iPhone SE 1
  [1032, 1376, 2], // iPad Pro 13" (M4)
  [1024, 1366, 2], // iPad Pro 12.9", iPad Air 13"
  [834, 1210, 2], // iPad Pro 11" (M4)
  [834, 1194, 2], // iPad Pro 11", iPad Air 11"
  [820, 1180, 2], // iPad Air, iPad 10th gen
  [834, 1112, 2], // iPad Air 3, iPad Pro 10.5"
  [810, 1080, 2], // iPad 7–9th gen
  [768, 1024, 2], // iPad mini 5, iPad 9.7"
  [744, 1133, 2], // iPad mini 6+
]

export const SPLASH_SCREENS: StartupImage = DEVICES.flatMap(([w, h, dpr]) =>
  (["portrait", "landscape"] as const).map((orientation) => {
    const [pw, ph] = orientation === "portrait" ? [w * dpr, h * dpr] : [h * dpr, w * dpr]
    return {
      url: `/splash/${pw}x${ph}.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: ${orientation})`,
    }
  }),
)
