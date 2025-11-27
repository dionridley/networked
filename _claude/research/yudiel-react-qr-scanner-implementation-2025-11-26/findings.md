# Research Findings: @yudiel/react-qr-scanner Implementation

**Date:** 2025-11-26

[← Back to Index](./index.md)

## Executive Summary

`@yudiel/react-qr-scanner` is a well-maintained, feature-rich library for QR code and barcode scanning in React applications. It offers TypeScript support, built-in camera controls, and flexible configuration options. However, implementers must be aware of browser compatibility limitations (Barcode Detection API is Chromium-only), mobile-specific quirks (especially iOS and Samsung devices), and the critical need for HTTPS in production. The library is suitable for Vite/TypeScript/React projects with proper consideration of these factors.

## Detailed Findings

### Finding 1: Library Architecture and Core Features

**Key Points:**
- Built on the native Barcode Detection API with webrtc-adapter for cross-browser compatibility
- Provides both a `Scanner` component and `useDevices` hook
- Supports 16+ barcode formats including QR codes, EAN, UPC, Code 128, Aztec, Data Matrix
- Includes built-in UI components: torch, zoom, finder overlay, on/off toggle, audio feedback
- Full TypeScript support with typed props and interfaces

**Analysis:**
The library abstracts the complexity of the Barcode Detection API while providing React-idiomatic patterns. The hook-based approach (`useDevices`) allows for flexible camera selection UIs. The component architecture supports both simple drop-in usage and highly customized implementations.

**Key Props:**

| Prop | Type | Purpose |
|------|------|---------|
| `onScan` | `(codes: IDetectedBarcode[]) => void` | Callback when barcodes detected |
| `onError` | `(error: unknown) => void` | Error handling callback |
| `constraints` | `MediaTrackConstraints` | Camera configuration |
| `formats` | `BarcodeFormat[]` | Barcode formats to detect |
| `paused` | `boolean` | Pause/resume scanning |
| `scanDelay` | `number` | Delay between scans (default: 500ms) |
| `components` | `IScannerComponents` | Enable UI controls |

**Supporting Evidence:**
- [npm package documentation](https://www.npmjs.com/package/@yudiel/react-qr-scanner)
- [GitHub repository](https://github.com/yudielcurbelo/react-qr-scanner)

---

### Finding 2: Browser Compatibility and Barcode Detection API

**Key Points:**
- Barcode Detection API is **only supported in Chromium-based browsers** (Chrome, Edge, Opera, Samsung Internet)
- Firefox has a feature request but no active development
- Safari has partial implementation behind a flag (not production-ready)
- Android Chrome and WebView have full support
- Polyfills using ZXing WASM are available (`barcode-detector` npm package)

**Analysis:**
This is the most significant limitation for production applications. The library will work out-of-the-box on Android devices with Chrome but will fail silently or throw errors on Firefox and Safari desktop. For production deployments targeting diverse browsers, a polyfill strategy is essential.

**Feature Detection Pattern:**
```typescript
if ("BarcodeDetector" in globalThis) {
  const formats = await BarcodeDetector.getSupportedFormats();
  // Native support available
} else {
  // Load polyfill or show fallback UI
}
```

**Supporting Evidence:**
- [MDN Barcode Detection API](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API)
- [Chrome Platform Status](https://chromestatus.com/feature/4757990523535360)

---

### Finding 3: Mobile Device Considerations

**Key Points:**
- **iOS Limitations**: Camera access only works in native Safari (not Chrome/Firefox/in-app browsers) on iOS < 14.3. iOS 14.3+ supports WebRTC in third-party browsers.
- **Samsung Focus Issues**: Devices like S22 may have camera focus problems, resulting in blurry QR codes
- **Torch/Zoom Conflict**: Some mobile browsers cannot use torch and zoom simultaneously; the library auto-disables torch when zoom is activated
- **Audio Feedback**: iOS beep sounds only work after user interaction

**Analysis:**
Mobile is the primary use case for QR scanning, yet it presents the most challenges. iOS restrictions significantly impact PWA deployments where the app runs in a WKWebView. Samsung's autofocus issues affect a large segment of Android users. Testing on actual devices is essential.

**Samsung Focus Workaround:**
```typescript
<Scanner
  constraints={{
    facingMode: 'environment',
    advanced: [{ zoom: 2 }, { focusMode: 'continuous' }]
  }}
  onScan={handleScan}
/>
```

**Supporting Evidence:**
- [GitHub Issue #24 - Constraints](https://github.com/yudielcurbelo/react-qr-scanner/issues/24)
- [Stack Overflow - Camera feed quality](https://stackoverflow.com/questions/72896550/how-can-i-improve-the-camera-feed-in-web-based-qr-code-reader)

---

### Finding 4: HTTPS and Secure Context Requirements

**Key Points:**
- Camera access via `getUserMedia` requires HTTPS or localhost
- Development on local network requires SSL certificates
- Vite plugins available: `@vitejs/plugin-basic-ssl` or `vite-plugin-mkcert`
- Alternative: Use ngrok for secure tunnel to localhost

**Analysis:**
This is a fundamental browser security requirement, not specific to this library. Development workflows must accommodate HTTPS from the start when testing on mobile devices. The `@vitejs/plugin-basic-ssl` provides the simplest setup for Vite projects.

**Vite SSL Setup:**
```typescript
// vite.config.ts
import basicSsl from '@vitejs/plugin-basic-ssl'

export default {
  plugins: [basicSsl()]
}
```

**Supporting Evidence:**
- [Vite HTTPS Guide](https://svayambhutech.com/enabling-https-on-localhost-with-vite-for-seamless-mobile-camera-access-and-cors-issue-resolution/)

---

### Finding 5: Error Handling and Permission Management

**Key Points:**
- `onError` prop catches camera errors including permission denial
- `NotAllowedError` indicates user denied camera permission
- `useDevices` hook returns empty `deviceId` when permission not granted
- No library can re-request permissions after user denial; must guide user to settings

**Analysis:**
Robust error handling is critical for user experience. The library provides error callbacks, but the application must implement appropriate UI feedback. Permission denial is particularly tricky as browsers don't allow programmatic re-requests—users must manually enable camera access in settings.

**Error Types to Handle:**
- `NotAllowedError`: Permission denied by user
- `NotFoundError`: No camera available
- `NotReadableError`: Camera in use by another application
- `OverconstrainedError`: Requested constraints cannot be satisfied

**Error Handling Pattern:**
```typescript
const onError = (error: unknown) => {
  if (error instanceof Error) {
    if (error.name === "NotAllowedError") {
      // Show UI guiding user to enable camera in settings
    } else if (error.name === "NotFoundError") {
      // Show "no camera available" message
    }
  }
};
```

**Supporting Evidence:**
- [GitHub Issue #113 - Permission denied](https://github.com/yudielcurbelo/react-qr-scanner/issues/113)

---

### Finding 6: Component Lifecycle and Cleanup

**Key Points:**
- Camera streams must be properly cleaned up on unmount
- Previous versions had issues with camera continuing after unmount (fixed in PR #8)
- `paused` prop can be used to stop scanning without unmounting
- Browser may freeze if video constraints change during active stream

**Analysis:**
Memory leaks and orphaned camera streams are common issues with camera-based libraries. The library has addressed major cleanup issues, but developers should still use the `paused` prop for temporary stops and ensure proper component unmounting. In SSR frameworks like Next.js, dynamic imports with `ssr: false` are required.

**Next.js Dynamic Import:**
```typescript
import dynamic from 'next/dynamic';

const Scanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner),
  { ssr: false }
);
```

**Supporting Evidence:**
- [GitHub Issue #4 - Camera keeps scanning](https://github.com/yudielcurbelo/react-qr-scanner/issues/4)

---

### Finding 7: TypeScript Constraints Limitation

**Key Points:**
- TypeScript definitions for `MediaTrackConstraints` don't include all browser-supported properties
- Properties like `focusMode` cause TypeScript errors despite browser support
- Workaround: Use `advanced` constraint array which accepts any properties
- Alternative: Use type assertions or `@ts-ignore`

**Analysis:**
This is a TypeScript typing issue, not a library bug. The browser's MediaTrackConstraints API supports more properties than the TypeScript definitions expose. The `advanced` array is the cleanest workaround as it bypasses type checking while remaining valid JavaScript.

**TypeScript Workaround:**
```typescript
// Using advanced array (preferred)
constraints={{
  facingMode: 'environment',
  advanced: [{ focusMode: 'continuous' }] as any
}}

// Using type assertion
constraints={{
  facingMode: 'environment',
  focusMode: 'continuous'
} as MediaTrackConstraints}
```

**Supporting Evidence:**
- [GitHub Issue #24](https://github.com/yudielcurbelo/react-qr-scanner/issues/24)

---

## Cross-Cutting Themes

1. **Mobile-First Requires Browser-Awareness**: While targeting mobile devices, the primary consideration is browser engine (Chromium vs WebKit vs Gecko), not device type.

2. **Native APIs Have Gaps**: The Barcode Detection API represents the future of web scanning but isn't universally supported yet. Polyfill strategies bridge this gap.

3. **Error Handling is UX**: Scanner failures (permissions, cameras, formats) directly impact user experience. Graceful degradation is essential.

---

## Implications

### Technical Implications
- Must implement polyfill strategy for Firefox/Safari support
- Vite config needs SSL plugin for mobile testing
- Component architecture should support conditional rendering for permission flows

### Business Implications
- iOS PWAs have limited scanning capabilities
- Target audience browser distribution affects viability
- May need fallback to image upload on unsupported browsers

### User Experience Implications
- Users on unsupported browsers need clear guidance
- Permission denial requires manual settings adjustment
- Camera switching/torch controls improve scanning success rate

---

## Gaps and Limitations

- **No offline scanning**: Polyfill requires WASM download
- **Limited iOS PWA support**: Camera access restricted in WKWebView
- **No image file scanning**: Library is camera-only (some alternatives support file input)
- **Active GitHub Issues**: Camera switching malfunction (#147), asset import issues (#146)

---

## Related Documents

- [Index](./index.md) - Research overview
- [Resources](./resources.md) - All references and links
- [Recommendations](./recommendations.md) - What to do next
- [Implementation Examples](./implementation-examples.md) - Code examples
