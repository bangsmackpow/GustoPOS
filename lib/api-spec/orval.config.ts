import { defineConfig } from "orval";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  "api-client-react": {
    input: {
      target: path.resolve(__dirname, "openapi.yaml"),
    },
    output: {
      workspace: path.resolve(__dirname, "..", "api-client-react", "src"),
      target: "generated",
      client: "react-query",
      mode: "split",
      baseUrl: "/api",
      clean: true,
      prettier: true,
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
        },
        mutator: {
          path: path.resolve(__dirname, "..", "api-client-react", "src", "custom-fetch.ts"),
          name: "customFetch",
        },
      },
    },
  },
  zod: {
    input: {
      target: path.resolve(__dirname, "openapi.yaml"),
    },
    output: {
      workspace: path.resolve(__dirname, "..", "api-zod", "src"),
      client: "zod",
      target: "generated/api.ts",
      mode: "single",
      clean: true,
      prettier: true,
      override: {
        zod: {
          coerce: {
            query: ["boolean", "number", "string"],
            param: ["boolean", "number", "string"],
          },
        },
        useDates: false,
      },
    },
  },
});
