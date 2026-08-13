import type { Plugin } from "vite"

export function localDbBackendPlugin(): Plugin {
  return {
    name: "transportos-local-db-plugin",
    async configureServer(server) {
      const { default: app } = await import("./index")
      server.middlewares.use(app)
    }
  }
}
