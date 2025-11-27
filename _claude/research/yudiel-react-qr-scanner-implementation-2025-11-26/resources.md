# Research Resources: @yudiel/react-qr-scanner Implementation

**Date:** 2025-11-26

[← Back to Index](./index.md)

## Primary Sources

### Official Documentation
- [@yudiel/react-qr-scanner npm](https://www.npmjs.com/package/@yudiel/react-qr-scanner) - Official npm package with API documentation, props reference, and usage examples
- [GitHub Repository](https://github.com/yudielcurbelo/react-qr-scanner) - Source code, issues, and detailed README documentation
- [MDN Barcode Detection API](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API) - Official web API documentation with browser compatibility tables

### API References
- [Chrome Platform Status - Barcode Detection](https://chromestatus.com/feature/4757990523535360) - Chrome implementation status and feature details
- [MediaTrackConstraints MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints) - Camera constraint options reference

## Secondary Sources

### Technical Articles
- [Enabling HTTPS on Localhost with Vite](https://svayambhutech.com/enabling-https-on-localhost-with-vite-for-seamless-mobile-camera-access-and-cors-issue-resolution/) - Svayambhu Tech - Step-by-step Vite SSL setup guide
- [Implementing a QR Code Scanner in React](https://medium.com/readytowork-org/implementing-a-qr-code-scanner-in-react-4c8f4e3c6f2e) - Medium - General React QR scanner implementation patterns
- [Building a Live QR Code Scanner with React and TypeScript](https://www.timsanteford.com/posts/building-a-live-qr-code-scanner-with-react-and-typescript/) - Tim Santeford - TypeScript-focused implementation guide
- [React.js Barcode Scanner Tutorial](https://scanbot.io/techblog/react-barcode-reader-tutorial/) - Scanbot SDK - Comprehensive barcode scanning overview

### Community Discussions
- [GitHub Issue #24 - Constraints](https://github.com/yudielcurbelo/react-qr-scanner/issues/24) - Discussion on focusMode and advanced constraints workarounds
- [GitHub Issue #113 - Permission denied](https://github.com/yudielcurbelo/react-qr-scanner/issues/113) - Error handling for camera permission denial
- [GitHub Issue #4 - Camera keeps scanning](https://github.com/yudielcurbelo/react-qr-scanner/issues/4) - Component cleanup and camera stream issues
- [GitHub Issue #112 - Upgrade issues](https://github.com/yudielcurbelo/react-qr-scanner/issues/112) - Module resolution problems after version upgrade
- [Stack Overflow - Camera feed quality](https://stackoverflow.com/questions/72896550/how-can-i-improve-the-camera-feed-in-web-based-qr-code-reader) - Solutions for improving scanning performance
- [Stack Overflow - facingMode issues](https://stackoverflow.com/questions/67739444/facingmode-property-not-working-in-react-qr-scanner-in-react-js) - Camera facing mode troubleshooting

## Code Examples and Repositories

- [@yudiel/react-qr-scanner CodeSandbox Examples](https://codesandbox.io/examples/package/@yudiel/react-qr-scanner) - Interactive examples of various configurations
- [QR Code Scanner - kiddocoder](https://github.com/kiddocoder/qr-code-scanner) - TypeScript implementation using qr-scanner library
- [QR Code PWA](https://github.com/robertoeb/QR-Code-PWA) - Scanner and QR Code Generator PWA built with React
- [Barcode Detection API Demo](https://github.com/tony-xlh/barcode-detection-api-demo) - Native API demonstration with polyfill examples

## Tools and Libraries

| Tool/Library | Link | Purpose | Notes |
|--------------|------|---------|-------|
| @yudiel/react-qr-scanner | [npm](https://www.npmjs.com/package/@yudiel/react-qr-scanner) | Primary QR scanning library | v2.4.1, ~49k weekly downloads, MIT license |
| barcode-detector | [npm](https://www.npmjs.com/package/barcode-detector) | ZXing WASM polyfill | For Firefox/Safari support |
| @vitejs/plugin-basic-ssl | [npm](https://www.npmjs.com/package/@vitejs/plugin-basic-ssl) | HTTPS for Vite dev server | Simple SSL setup |
| vite-plugin-mkcert | [npm](https://www.npmjs.com/package/vite-plugin-mkcert) | Local trusted certificates | More robust SSL option |
| webrtc-adapter | [npm](https://www.npmjs.com/package/webrtc-adapter) | Cross-browser WebRTC shim | Bundled with library |

## Alternative Libraries

| Library | Link | Comparison |
|---------|------|------------|
| react-qr-reader | [npm](https://www.npmjs.com/package/react-qr-reader) | Simpler API, legacy mode for iOS, less active maintenance |
| react-qr-barcode-scanner | [npm](https://www.npmjs.com/package/react-qr-barcode-scanner) | Uses @zxing/library, stopStream prop for cleanup |
| html5-qrcode | [npm](https://www.npmjs.com/package/html5-qrcode) | Framework-agnostic, file input support |
| qr-scanner | [npm](https://www.npmjs.com/package/qr-scanner) | Lightweight, web worker support |
| @leelexuan/react-qr-scanner | [npm](https://www.npmjs.com/package/@leelexuan/react-qr-scanner) | Fork with enhanced interaction feedback |

## Security Analysis

- [Socket.dev Security Analysis](https://socket.dev/npm/package/@yudiel/react-qr-scanner) - Automated security scanning of package dependencies
- [SOOS Package Analysis](https://app.soos.io/research/packages/NPM/@yudiel/react-qr-scanner/) - Security and licensing analysis

## Browser Support References

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome (Desktop & Android) | Full | Native Barcode Detection API |
| Edge | Full | Chromium-based |
| Samsung Internet | Full | Chromium-based |
| Firefox | Polyfill Required | No native API support |
| Safari | Polyfill Required | Behind flag only |
| iOS Safari | Camera Works | Native scanner available on iOS 15+ |
| iOS Chrome/Firefox | Limited | WebRTC support since iOS 14.3 |
| PWA (iOS) | Limited | WKWebView restrictions |

## Further Reading

### For Beginners
- [npm package README](https://www.npmjs.com/package/@yudiel/react-qr-scanner) - Start here for basic setup and props
- [CodeSandbox examples](https://codesandbox.io/examples/package/@yudiel/react-qr-scanner) - Interactive playground

### For Advanced Understanding
- [Barcode Detection API Specification](https://wicg.github.io/shape-detection-api/#barcode-detection-api) - W3C specification
- [On barcodes and Web APIs](https://soledadpenades.com/posts/2025/on-barcodes-and-web-apis/) - Deep dive into API landscape and future
- [WebRTC MediaStream API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_API) - Understanding camera streams

---

## Related Documents

- [Index](./index.md) - Research overview
- [Findings](./findings.md) - Core research findings
- [Recommendations](./recommendations.md) - What to do next
- [Implementation Examples](./implementation-examples.md) - Code examples
