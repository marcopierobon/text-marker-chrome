import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import copy from "rollup-plugin-copy";
import { defineConfig } from "rollup";

// Determine target browser from environment variable
const target = process.env.TARGET || "chrome";
const isFirefox = target === "firefox";

// Output directory based on target
const outputDir = isFirefox ? "dist-firefox" : "dist";

// Manifest file based on target
const manifestFile = isFirefox ? "manifest.firefox.json" : "manifest.json";

export default defineConfig([
  // Background script
  {
    input: "background.ts",
    output: {
      file: `${outputDir}/background.js`,
      format: "iife",
      sourcemap: true,
    },
    plugins: [
      resolve({ extensions: [".ts", ".js"] }),
      typescript({
        tsconfig: "./tsconfig.json",
        sourceMap: true,
        declaration: false,
        compilerOptions: {
          outDir: outputDir,
        },
      }),
    ],
  },
  // Content script
  {
    input: "content/content.ts",
    output: {
      file: `${outputDir}/content/content.js`,
      format: "iife",
      sourcemap: true,
    },
    plugins: [
      resolve({ extensions: [".ts", ".js"] }),
      typescript({
        tsconfig: "./tsconfig.json",
        sourceMap: true,
        declaration: false,
        compilerOptions: {
          outDir: `${outputDir}/content`,
        },
      }),
    ],
  },
  // Popup script
  {
    input: "popup/popup.ts",
    output: {
      file: `${outputDir}/popup/popup.js`,
      format: "iife",
      sourcemap: true,
    },
    plugins: [
      resolve({ extensions: [".ts", ".js"] }),
      typescript({
        tsconfig: "./tsconfig.json",
        sourceMap: true,
        declaration: false,
        compilerOptions: {
          outDir: `${outputDir}/popup`,
        },
      }),
      copy({
        targets: [
          { src: manifestFile, dest: outputDir, rename: "manifest.json" },
          { src: "popup/popup.html", dest: `${outputDir}/popup` },
          { src: "popup/popup.css", dest: `${outputDir}/popup` },
          { src: "icons/*", dest: `${outputDir}/icons` },
        ],
      }),
    ],
  },
]);
