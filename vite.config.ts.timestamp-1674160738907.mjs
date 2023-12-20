// vite.config.ts
import { resolve } from "node:path";
import react from "file:///D:/Workspace/@rinzai/zen/node_modules/@vitejs/plugin-react-swc/index.mjs";
import { defineConfig } from "file:///D:/Workspace/@rinzai/zen/node_modules/vite/dist/node/index.js";
import dts from "file:///D:/Workspace/@rinzai/zen/node_modules/vite-plugin-dts/dist/index.mjs";
import tsConfigPaths from "file:///D:/Workspace/@rinzai/zen/node_modules/vite-tsconfig-paths/dist/index.mjs";

// package.json
var peerDependencies = {
  react: "^18.2.0",
  "react-dom": "^18.2.0"
};

// vite.config.ts
import cssInjectedByJs from "file:///D:/Workspace/@rinzai/zen/node_modules/vite-plugin-css-injected-by-js/dist/esm/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tsConfigPaths(),
    cssInjectedByJs(),
    dts({
      include: ["packages/"]
    })
  ],
  build: {
    lib: {
      entry: resolve("components", "index.tsx"),
      name: "Zen",
      formats: ["es", "umd"],
      fileName: (format) => `zen.${format}.js`
    },
    rollupOptions: {
      external: [...Object.keys(peerDependencies)],
      output: {
        globals: {
          react: "React"
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxXb3Jrc3BhY2VcXFxcQHJpbnphaVxcXFx6ZW5cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXFdvcmtzcGFjZVxcXFxAcmluemFpXFxcXHplblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovV29ya3NwYWNlL0ByaW56YWkvemVuL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCdcblxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0LXN3YydcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgZHRzIGZyb20gJ3ZpdGUtcGx1Z2luLWR0cydcbmltcG9ydCB0c0NvbmZpZ1BhdGhzIGZyb20gJ3ZpdGUtdHNjb25maWctcGF0aHMnXG5pbXBvcnQgeyBwZWVyRGVwZW5kZW5jaWVzIH0gZnJvbSAnLi9wYWNrYWdlLmpzb24nXG5pbXBvcnQgY3NzSW5qZWN0ZWRCeUpzIGZyb20gJ3ZpdGUtcGx1Z2luLWNzcy1pbmplY3RlZC1ieS1qcydcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gICAgcGx1Z2luczogW1xuICAgICAgICByZWFjdCgpLFxuICAgICAgICB0c0NvbmZpZ1BhdGhzKCksXG4gICAgICAgIGNzc0luamVjdGVkQnlKcygpLFxuICAgICAgICBkdHMoe1xuICAgICAgICAgICAgaW5jbHVkZTogWydjb21wb25lbnRzLyddLFxuICAgICAgICB9KSxcbiAgICBdLFxuICAgIGJ1aWxkOiB7XG4gICAgICAgIGxpYjoge1xuICAgICAgICAgICAgZW50cnk6IHJlc29sdmUoJ2NvbXBvbmVudHMnLCAnaW5kZXgudHMnKSxcbiAgICAgICAgICAgIG5hbWU6ICdaZW4nLFxuICAgICAgICAgICAgZm9ybWF0czogWydlcycsICd1bWQnXSxcbiAgICAgICAgICAgIGZpbGVOYW1lOiAoZm9ybWF0KSA9PiBgemVuLiR7Zm9ybWF0fS5qc2AsXG4gICAgICAgIH0sXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgIGV4dGVybmFsOiBbLi4uT2JqZWN0LmtleXMocGVlckRlcGVuZGVuY2llcyldLFxuICAgICAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgICAgICAgZ2xvYmFsczoge1xuICAgICAgICAgICAgICAgICAgICByZWFjdDogJ1JlYWN0JyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1EsU0FBUyxlQUFlO0FBRTFSLE9BQU8sV0FBVztBQUNsQixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFNBQVM7QUFDaEIsT0FBTyxtQkFBbUI7Ozs7Ozs7OztBQUUxQixPQUFPLHFCQUFxQjtBQUM1QixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixTQUFTO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsSUFDZCxnQkFBZ0I7QUFBQSxJQUNoQixJQUFJO0FBQUEsTUFDQSxTQUFTLENBQUMsYUFBYTtBQUFBLElBQzNCLENBQUM7QUFBQSxFQUNMO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDSCxLQUFLO0FBQUEsTUFDRCxPQUFPLFFBQVEsY0FBYyxVQUFVO0FBQUEsTUFDdkMsTUFBTTtBQUFBLE1BQ04sU0FBUyxDQUFDLE1BQU0sS0FBSztBQUFBLE1BQ3JCLFVBQVUsQ0FBQyxXQUFXLE9BQU87QUFBQSxJQUNqQztBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ1gsVUFBVSxDQUFDLEdBQUcsT0FBTyxLQUFLLGdCQUFnQixDQUFDO0FBQUEsTUFDM0MsUUFBUTtBQUFBLFFBQ0osU0FBUztBQUFBLFVBQ0wsT0FBTztBQUFBLFFBQ1g7QUFBQSxNQUNKO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
