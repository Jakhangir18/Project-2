# SeeAI — Real-time Object Detection in the Browser

Real-time object detection running entirely in the browser, powered by **YOLOv8** and **ONNX Runtime Web**. No server needed — inference happens locally on your device.

## ✨ Features

- Live webcam object detection with YOLOv8n
- Runs 100% client-side via ONNX Runtime (WebAssembly + WebGPU)
- Cinematic Minecraft-inspired voxel world UI (CommitWeather integration)
- Built with React 18, TypeScript, Vite, and Tailwind CSS

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher (comes with Node.js)

### Installation

```sh
# 1. Clone the repository
git clone https://github.com/Jakhangir18/Project-2.git

# 2. Enter the project directory
cd Project-2

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

> **Note:** The app requires camera access for live detection. Allow the permission prompt when the browser asks.

### Build for Production

```sh
npm run build
```

The output will be in the `dist/` folder. You can serve it with any static hosting provider (Vercel, Netlify, GitHub Pages, etc.).

```sh
# Preview the production build locally
npm run preview
```

## 🛠 Tech Stack

| Tool | Purpose |
|---|---|
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| [React 18](https://react.dev/) | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |
| [shadcn/ui](https://ui.shadcn.com/) | UI component library |
| [ONNX Runtime Web](https://onnxruntime.ai/) | In-browser ML inference |
| [YOLOv8n](https://ultralytics.com/yolov8) | Object detection model |

## 📁 Project Structure

```
Project-2/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page-level components
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utility functions
├── yolov8n.onnx        # ONNX model (YOLOv8 nano)
├── index.html
├── vite.config.ts
└── package.json
```


