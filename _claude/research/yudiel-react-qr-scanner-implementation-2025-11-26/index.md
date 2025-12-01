# Research: @yudiel/react-qr-scanner Implementation

**Date:** 2025-11-26
**Research Question:** How to implement @yudiel/react-qr-scanner in a Vite/TypeScript/React application for mobile QR code scanning, including pros/cons, optimizations, and best practices.

## Overview

This research covers the implementation of `@yudiel/react-qr-scanner` (v2.4.1), a modern React library for scanning QR codes and barcodes using device cameras. The library is built on top of the Barcode Detection API with React hooks and TypeScript support, receiving approximately 48,692 weekly npm downloads.

The research addresses:
- Library capabilities and limitations
- Mobile device considerations and browser compatibility
- Common issues and community-discovered workarounds
- Performance optimizations
- Integration with Vite/TypeScript projects

## Structure

This research is organized into multiple documents:

- **[Findings](./findings.md)** - Core research findings and technical analysis
- **[Resources](./resources.md)** - Links, documentation, and references
- **[Recommendations](./recommendations.md)** - Actionable implementation recommendations
- **[Implementation Examples](./implementation-examples.md)** - Code examples for common scenarios

## Key Takeaways

1. **Browser Support is Limited**: The Barcode Detection API is only fully supported in Chromium-based browsers. Firefox and Safari require polyfills (ZXing-based WASM) for production use.

2. **HTTPS is Mandatory**: Camera access requires secure context (HTTPS or localhost). Use `@vitejs/plugin-basic-ssl` or `vite-plugin-mkcert` for development.

3. **Mobile-Specific Issues Exist**: Samsung devices may have focus problems (use `focusMode: continuous` via advanced constraints), and iOS has significant limitations outside Safari.

4. **Proper Cleanup is Critical**: Always handle component unmounting to prevent memory leaks and camera stream issues. Use the `paused` prop and proper lifecycle management.

5. **TypeScript Types May Be Restrictive**: Some browser-supported constraints like `focusMode` aren't in TypeScript definitions. Use the `advanced` constraint array or type assertions as workarounds.
