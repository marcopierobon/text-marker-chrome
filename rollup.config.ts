import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import copy from "rollup-plugin-copy";
import { defineConfig } from "rollup";

export default defineConfig({
  input: {
    background: "background.ts",
    "content/content": "content/content.ts",
    "popup/popup": "popup/popup.ts",
  },
  output: {
    dir: "dist",
    format: "es",
    sourcemap: true,
    preserveModules: false,
  },
  plugins: [
    resolve({
      extensions: [".ts", ".js"],
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      sourceMap: true,
      declaration: false,
      declarationMap: false,
      outDir: "dist",
    }),
    copy({
      targets: [
        { src: "manifest.json", dest: "dist" },
        { src: "popup/popup.html", dest: "dist/popup" },
        { src: "popup/popup.css", dest: "dist/popup" },
      ],
    }),
  ],
});
