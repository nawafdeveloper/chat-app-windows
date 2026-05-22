# Yahla Windows

Electron desktop app starter with TypeScript, React, and TSX components.

## Commands

```bash
npm install
npm run check
npm run build
npm run dev
```

- `npm run check` runs TypeScript type checking without opening Electron.
- `npm run build` type-checks and creates production output in `out/`.
- `npm run dev` starts the Electron + Vite development environment.
- `npm start` also starts the development environment.
- `npm run preview` opens the built Electron app from `out/`.

On Windows PowerShell, if `npm` is blocked by the execution policy, use
`npm.cmd` instead:

```bash
npm.cmd run check
npm.cmd run build
npm.cmd run dev
```

## Project Structure

```text
src/
  main/
    index.ts          Electron main process and window setup
  preload/
    index.ts          Safe bridge between Electron and the renderer
  renderer/
    index.html        Vite renderer HTML entry
    src/
      main.tsx        React renderer entry
      App.tsx         Main app component
      components/     TSX components
      styles.css      Renderer styles
      types/          Renderer type declarations
```

Configuration lives in `electron.vite.config.ts` and the TypeScript configs are
split between Node/Electron code and renderer code.
