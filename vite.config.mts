import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path, { resolve } from "path";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ mode }) => {
    const isDev = mode === "development";

    return {
        plugins: [
            react(),
            svgr(),
            tailwindcss(),
            viteStaticCopy({
                targets: [
                    {
                        src: "assets",
                        dest: "",
                    },
                    {
                        src: "fonts",
                        dest: "",
                    },
                    {
                        src: "module.json",
                        dest: "",
                    },
                ],
            }),
        ],

        base: isDev ? `/modules/draw-steel-rolls` : "./",

        server: isDev
            ? {
                  port: 30001,
                  proxy: {
                      [`^/(?!modules/draw-steel-rolls)`]:
                          "http://localhost:30000",
                      "/socket.io": {
                          target: "ws://localhost:30000",
                          ws: true,
                      },
                  },
              }
            : undefined,

        publicDir: false,

        build: {
            outDir: "dist",
            rollupOptions: {
                input: {
                    main: resolve(__dirname, "src/main.tsx"),
                },
                output: {
                    entryFileNames: "[name].bundle.js",
                    chunkFileNames: "assets/[name].js",
                    assetFileNames: "assets/[name].[ext]",
                },
            },
        },

        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src"),
            },
        },
    };
});
