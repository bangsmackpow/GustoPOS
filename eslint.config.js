import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.generated/**",
      "**/generated/**",
      "**/*.mjs"
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Base configuration for all TS files
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Too many to fix right now
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-namespace": "off", // Used for Express augmentation
      "@typescript-eslint/no-empty-object-type": "off", // Used for Express augmentation
    },
  },
  // React-specific configuration
  {
    files: ["artifacts/gusto-pos/**/*.{ts,tsx}", "artifacts/mockup-sandbox/**/*.{ts,tsx}"],
    plugins: {
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off", // TS handles this
      "react/no-unknown-property": ["error", { ignore: ["cmdk-input-wrapper"] }],
      "react-hooks/exhaustive-deps": "warn",
    },
  }
);
