# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

Electron + React + TypeScript UI for a Windows desktop recorder. Scaffolded from Electron React Boilerplate (ERB); the bulk of the actual recording work is **not** in this repo — it is a separate C++ binary, `VideoService.exe`, that is checked in at the repo root and spawned as a child process.

The native recorder's source code lives at **`/mnt/c/repos/DesktopRecorderLibrary`** (also published as https://github.com/jgcoded/DesktopRecorderLibrary). The `VideoService.exe` here is the built artifact of that project — any changes to capture, encoding, GPU pipeline, or the IPC protocol on the native side happen there, not here.

## Commands

- `npm start` — dev mode. Runs the renderer dev server (`webpack-dev-server`), then `start:main` boots Electron via `electronmon` with `ts-node` (no precompile). `electronmon` only watches `src/main/**`.
- `npm run package` — full production build (renderer + main via webpack), then `electron-builder build` into `release/build/`.
- `npm run build:main` / `npm run build:renderer` — build each side independently.
- `npm run lint` — ESLint over `.js,.jsx,.ts,.tsx`.
- `npm test` — Jest (jsdom env). `setupFiles` runs `.erb/scripts/check-build-exists.ts` which **errors out if `src/renderer/dist` is missing** — run `npm run build:renderer` once before the first test run.
- Run a single test: `npx jest src/__tests__/App.test.tsx` or `npx jest -t "<test name pattern>"`.
- `npm run rebuild` — rebuild native modules under `release/app/` (only needed if native deps are added).

## Architecture

### Three-tier Electron process model

1. **Main process** (`src/main/`) — Node, owns `BrowserWindow`, screen API, global shortcuts, child-process lifecycle. Frameless transparent window whose size/position/shape it manages on behalf of the renderer.
2. **Preload** (`src/main/preload.ts`) — runs in the renderer's isolated context; `contextBridge.exposeInMainWorld('electron', { ipcRenderer: ipcApi })` is the **only** surface the renderer is allowed to use to talk to Node. `src/renderer/preload.d.ts` types the `window.electron` global.
3. **Renderer** (`src/renderer/`) — React 18, class components, react-router-dom. Never imports anything from `src/main/`. All privileged operations go through `window.electron.ipcRenderer.*`.

### IPC contract is single-sourced

`src/common/IpcApi.ts` is the contract. It declares:
- `RendererIpcCommands` enum — request channels (renderer → main, used with `ipcRenderer.invoke` / `ipcMain.handle`).
- `IpcEventsFromMain` enum — push channels (main → renderer, used with `webContents.send` / `ipcRenderer.on`).
- `IpcApi` interface — the typed shape exposed on `window.electron.ipcRenderer`.

When adding an IPC call you must touch four places in lockstep: add to `RendererIpcCommands`, add a method to `IpcApi`, implement it in `src/main/preload.ts`, and register an `ipcMain.handle` in `src/main/main.ts`. Forgetting the preload mapping is the usual cause of "function is undefined" in the renderer.

### VideoService.exe child process

`src/main/RecordingChildProcess.ts` is the bridge to the native recorder. Pattern:

1. `SpawnVideoService()` searches `process.resourcesPath`, `process.cwd()`, and `cwd/resources` for `VideoService.exe`, then `spawn`s it with `stdio: 'pipe'`.
2. Each operation is one short-lived process: `LaunchAndGetRecordableDevices`, `LaunchAndGetFileSharingToken`, `LaunchAndStartRecording`. Recording is the only one kept alive — `StopRecording` writes a second command to its stdin.
3. Protocol is JSON-per-line over stdio. Commands extend `VideoServiceCommand` and serialize as `${JSON.stringify(this)}\r\n`. Responses for the synchronous calls are read with a one-shot `'data'` listener and `JSON.parse`d — so a single response must fit in one stdin chunk.

If you change `command` strings or command payload shape, the matching parser lives in the C++ side under `/mnt/c/repos/DesktopRecorderLibrary` — both sides must change together.

### Recording lifecycle (where to look when something breaks)

- UI toggle → `src/renderer/components/app/App.tsx::toggleRecording` (debounced via `RecordingStateChangeDelay = 3000ms` and `isRecordingBlocked`).
- → `src/renderer/ipc/RecordingService.ts` (singleton; builds filename + bitrate, emits `'recording-state-changed'`).
- → `window.electron.ipcRenderer.LaunchAndStartRecording(settings)`.
- → `src/main/main.ts` ipc handler spawns `RecordingChildProcess`, wires an `'exit'` listener that fires `IpcEventsFromMain.OnRecordingChildProcessExit` back to the renderer.
- Bitrate is computed in the renderer from `common/config.json`'s `bitrate-settings` table via `RecordingService.DetermineBitRate` (best-match scoring over resolution/bitrate option/framerate — `auto` falls out as the lowest-match-count entry).

### Module resolution

`tsconfig.json` sets `"baseUrl": "./src"`, so imports like `common/RecordingSettings` and `renderer/ipc/RecordingService` are absolute from `src/`. Jest mirrors this via `moduleDirectories: ["node_modules", "release/app/node_modules", "src"]`. Webpack configs under `.erb/configs/` handle the same for builds. Prefer these absolute paths over `../../../common/...`.

### `src/common/` is shared between main and renderer

Anything in `common/` is imported by both processes. Pure types/enums/JSON config are fine. **Do not** put code with Node-only or DOM-only dependencies here — `ConfigService`, `SettingsStorage`, and `TelemetryService` are the existing pattern (browser-safe). Telemetry is App Insights; the key comes from `common/config.json::appinsights-api-key` and an empty string disables telemetry at init.

### Window sizing quirk

The main window is frameless + transparent and starts at `0×0`. Final dimensions are computed in the renderer (`ConfigService.getWindowWidthConstant` / `getWindowHeightConstant`, derived from `common/px.json` plus a shadow-size pad) and pushed back to main via `SetWindowSize`. When a panel toggles visibility (`App.tsx::toggle*Panel`), the renderer recomputes and calls `AppWindow.updateMainWindowSize` in the `setState` callback. Main also pushes `IpcEventsFromMain.ScaleChanged` when the window crosses a display-scale boundary so the renderer can recompute.
