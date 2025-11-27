# Implementation Examples: @yudiel/react-qr-scanner

**Date:** 2025-11-26

[← Back to Index](./index.md)

This document provides copy-paste ready code examples for implementing QR scanning in a Vite/TypeScript/React application.

## Table of Contents
1. [Installation](#installation)
2. [Vite Configuration](#vite-configuration)
3. [Basic Scanner Component](#basic-scanner-component)
4. [Scanner with Camera Selection](#scanner-with-camera-selection)
5. [Scanner with Error Handling](#scanner-with-error-handling)
6. [Scanner with All UI Controls](#scanner-with-all-ui-controls)
7. [Mobile-Optimized Scanner](#mobile-optimized-scanner)
8. [Browser Compatibility with Polyfill](#browser-compatibility-with-polyfill)
9. [Next.js Dynamic Import](#nextjs-dynamic-import)

---

## Installation

```bash
# Install the main library
npm install @yudiel/react-qr-scanner

# For Vite HTTPS (development)
npm install @vitejs/plugin-basic-ssl -D

# For browser polyfill (Firefox/Safari support)
npm install barcode-detector
```

---

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    react(),
    basicSsl() // Enables HTTPS for camera access on mobile
  ],
  server: {
    host: true, // Expose to local network for mobile testing
  }
});
```

---

## Basic Scanner Component

The simplest implementation:

```tsx
// components/BasicScanner.tsx
import { Scanner } from '@yudiel/react-qr-scanner';

interface BasicScannerProps {
  onScan: (result: string) => void;
}

export function BasicScanner({ onScan }: BasicScannerProps) {
  return (
    <Scanner
      onScan={(detectedCodes) => {
        if (detectedCodes.length > 0) {
          onScan(detectedCodes[0].rawValue);
        }
      }}
      onError={(error) => console.error('Scanner error:', error)}
    />
  );
}

// Usage
function App() {
  const handleScan = (result: string) => {
    console.log('Scanned:', result);
  };

  return <BasicScanner onScan={handleScan} />;
}
```

---

## Scanner with Camera Selection

Allows users to choose which camera to use:

```tsx
// components/CameraSelectorScanner.tsx
import { useState } from 'react';
import { Scanner, useDevices } from '@yudiel/react-qr-scanner';

interface CameraSelectorScannerProps {
  onScan: (result: string) => void;
}

export function CameraSelectorScanner({ onScan }: CameraSelectorScannerProps) {
  const devices = useDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();

  return (
    <div>
      {devices.length > 1 && (
        <select
          value={selectedDeviceId || ''}
          onChange={(e) => setSelectedDeviceId(e.target.value || undefined)}
          style={{ marginBottom: '1rem', padding: '0.5rem' }}
        >
          <option value="">Select Camera</option>
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
            </option>
          ))}
        </select>
      )}

      <Scanner
        onScan={(detectedCodes) => {
          if (detectedCodes.length > 0) {
            onScan(detectedCodes[0].rawValue);
          }
        }}
        constraints={{
          deviceId: selectedDeviceId,
          facingMode: selectedDeviceId ? undefined : 'environment',
        }}
      />
    </div>
  );
}
```

---

## Scanner with Error Handling

Comprehensive error handling for production use:

```tsx
// components/RobustScanner.tsx
import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

interface RobustScannerProps {
  onScan: (result: string) => void;
}

type ScannerError =
  | 'permission_denied'
  | 'no_camera'
  | 'camera_in_use'
  | 'unknown';

export function RobustScanner({ onScan }: RobustScannerProps) {
  const [error, setError] = useState<ScannerError | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      switch (err.name) {
        case 'NotAllowedError':
          setError('permission_denied');
          break;
        case 'NotFoundError':
          setError('no_camera');
          break;
        case 'NotReadableError':
          setError('camera_in_use');
          break;
        default:
          setError('unknown');
          console.error('Scanner error:', err);
      }
    }
  };

  const handleScan = (detectedCodes: { rawValue: string }[]) => {
    if (detectedCodes.length > 0) {
      setIsPaused(true); // Pause after successful scan
      onScan(detectedCodes[0].rawValue);
    }
  };

  if (error === 'permission_denied') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Camera Permission Required</h3>
        <p>Please enable camera access in your browser settings to scan QR codes.</p>
        <button onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }

  if (error === 'no_camera') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>No Camera Found</h3>
        <p>This device does not appear to have a camera.</p>
      </div>
    );
  }

  if (error === 'camera_in_use') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Camera In Use</h3>
        <p>The camera is being used by another application. Please close it and try again.</p>
        <button onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }

  return (
    <div>
      <Scanner
        onScan={handleScan}
        onError={handleError}
        paused={isPaused}
        scanDelay={500}
      />
      {isPaused && (
        <button
          onClick={() => setIsPaused(false)}
          style={{ marginTop: '1rem' }}
        >
          Scan Another
        </button>
      )}
    </div>
  );
}
```

---

## Scanner with All UI Controls

Enable built-in UI components:

```tsx
// components/FullFeaturedScanner.tsx
import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

interface FullFeaturedScannerProps {
  onScan: (result: string) => void;
}

export function FullFeaturedScanner({ onScan }: FullFeaturedScannerProps) {
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleScan = (detectedCodes: { rawValue: string }[]) => {
    if (detectedCodes.length > 0) {
      const result = detectedCodes[0].rawValue;
      setLastResult(result);
      onScan(result);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <Scanner
        onScan={handleScan}
        onError={(error) => console.error('Scanner error:', error)}
        scanDelay={500}
        allowMultiple={false}
        components={{
          audio: true,    // Beep on successful scan
          onOff: true,    // Camera on/off toggle
          torch: true,    // Flashlight toggle (if supported)
          zoom: true,     // Zoom control (if supported)
          finder: true,   // Targeting overlay
        }}
        styles={{
          container: {
            borderRadius: '8px',
            overflow: 'hidden',
          },
        }}
      />

      {lastResult && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#f0f0f0',
          borderRadius: '4px'
        }}>
          <strong>Last Scan:</strong> {lastResult}
        </div>
      )}
    </div>
  );
}
```

---

## Mobile-Optimized Scanner

With Samsung focus fix and optimized constraints:

```tsx
// components/MobileScanner.tsx
import { Scanner, useDevices } from '@yudiel/react-qr-scanner';
import { useState, useMemo } from 'react';

interface MobileScannerProps {
  onScan: (result: string) => void;
}

export function MobileScanner({ onScan }: MobileScannerProps) {
  const devices = useDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>();

  // Find the back camera by default
  const backCamera = useMemo(() => {
    return devices.find(
      (device) =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
    );
  }, [devices]);

  // Use back camera if found and no specific device selected
  const deviceId = selectedDeviceId || backCamera?.deviceId;

  return (
    <div>
      {devices.length > 1 && (
        <select
          value={selectedDeviceId || ''}
          onChange={(e) => setSelectedDeviceId(e.target.value || undefined)}
        >
          <option value="">Auto (Back Camera)</option>
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
            </option>
          ))}
        </select>
      )}

      <Scanner
        onScan={(detectedCodes) => {
          if (detectedCodes.length > 0) {
            onScan(detectedCodes[0].rawValue);
          }
        }}
        formats={['qr_code']} // Only scan QR codes for faster detection
        scanDelay={300}
        constraints={{
          deviceId: deviceId,
          facingMode: deviceId ? undefined : 'environment',
          // Higher resolution for better scanning
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          // Samsung focus fix and general optimization
          advanced: [
            { focusMode: 'continuous' } as any,
            { zoom: 1.5 } as any, // Slight zoom helps with small QR codes
          ],
        }}
        components={{
          finder: true,
          torch: true,
        }}
      />
    </div>
  );
}
```

---

## Browser Compatibility with Polyfill

For Firefox and Safari support:

```tsx
// components/CompatibleScanner.tsx
import { lazy, Suspense, useEffect, useState } from 'react';

// Lazy load the scanner to defer polyfill loading
const ScannerComponent = lazy(() => import('./ScannerWrapper'));

interface CompatibleScannerProps {
  onScan: (result: string) => void;
}

export function CompatibleScanner({ onScan }: CompatibleScannerProps) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [polyfillLoaded, setPolyfillLoaded] = useState(false);

  useEffect(() => {
    // Check for native Barcode Detection API support
    const hasNativeSupport = 'BarcodeDetector' in globalThis;

    if (hasNativeSupport) {
      setIsSupported(true);
      setPolyfillLoaded(true);
    } else {
      // Load polyfill for unsupported browsers
      import('barcode-detector')
        .then(({ BarcodeDetector }) => {
          (globalThis as any).BarcodeDetector = BarcodeDetector;
          setIsSupported(true);
          setPolyfillLoaded(true);
        })
        .catch((error) => {
          console.error('Failed to load barcode polyfill:', error);
          setIsSupported(false);
        });
    }
  }, []);

  if (isSupported === null) {
    return <div>Checking browser compatibility...</div>;
  }

  if (!isSupported) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Browser Not Supported</h3>
        <p>Please use Chrome, Edge, or Safari to scan QR codes.</p>
      </div>
    );
  }

  if (!polyfillLoaded) {
    return <div>Loading scanner...</div>;
  }

  return (
    <Suspense fallback={<div>Loading scanner...</div>}>
      <ScannerComponent onScan={onScan} />
    </Suspense>
  );
}

// ScannerWrapper.tsx (separate file for code splitting)
import { Scanner } from '@yudiel/react-qr-scanner';

interface ScannerWrapperProps {
  onScan: (result: string) => void;
}

export default function ScannerWrapper({ onScan }: ScannerWrapperProps) {
  return (
    <Scanner
      onScan={(detectedCodes) => {
        if (detectedCodes.length > 0) {
          onScan(detectedCodes[0].rawValue);
        }
      }}
      onError={(error) => console.error('Scanner error:', error)}
    />
  );
}
```

---

## Next.js Dynamic Import

For Next.js applications (SSR-safe):

```tsx
// components/NextScanner.tsx
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

interface ScannerProps {
  onScan: (result: string) => void;
}

// Dynamic import with SSR disabled
const Scanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((mod) => {
    const { Scanner } = mod;

    // Wrapper component
    const WrappedScanner: ComponentType<ScannerProps> = ({ onScan }) => (
      <Scanner
        onScan={(detectedCodes) => {
          if (detectedCodes.length > 0) {
            onScan(detectedCodes[0].rawValue);
          }
        }}
        onError={(error) => console.error('Scanner error:', error)}
        components={{
          finder: true,
          torch: true,
        }}
      />
    );

    return WrappedScanner;
  }),
  {
    ssr: false,
    loading: () => <div>Loading scanner...</div>
  }
);

export default function NextScanner({ onScan }: ScannerProps) {
  return <Scanner onScan={onScan} />;
}

// Usage in pages
import NextScanner from '@/components/NextScanner';

export default function ScanPage() {
  const handleScan = (result: string) => {
    console.log('Scanned:', result);
  };

  return (
    <div>
      <h1>Scan QR Code</h1>
      <NextScanner onScan={handleScan} />
    </div>
  );
}
```

---

## TypeScript Type Definitions

Common types for scanner implementations:

```typescript
// types/scanner.ts
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner';

export interface ScanResult {
  value: string;
  format: string;
  timestamp: Date;
}

export type ScannerError =
  | 'permission_denied'
  | 'no_camera'
  | 'camera_in_use'
  | 'not_supported'
  | 'unknown';

export interface ScannerProps {
  onScan: (result: ScanResult) => void;
  onError?: (error: ScannerError) => void;
  enabled?: boolean;
}

// Convert library result to app result
export function parseScanResult(detectedCodes: IDetectedBarcode[]): ScanResult | null {
  if (detectedCodes.length === 0) return null;

  const code = detectedCodes[0];
  return {
    value: code.rawValue,
    format: code.format,
    timestamp: new Date(),
  };
}
```

---

## Related Documents

- [Index](./index.md) - Research overview
- [Findings](./findings.md) - Core research findings
- [Resources](./resources.md) - All references and links
- [Recommendations](./recommendations.md) - What to do next
