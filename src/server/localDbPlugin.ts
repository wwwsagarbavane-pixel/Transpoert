import type { Plugin } from "vite"
import app from "./index"

export function localDbBackendPlugin(): Plugin {
  return {
    name: "transportos-local-db-plugin",
    configureServer(server) {
      server.middlewares.use(app)
    }
  }
}
