// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // A promise left without await or void (like expo-file-system's File.copy) runs out of order;
    // that once broke the content database install on the phone.
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: __dirname } },
    rules: { "@typescript-eslint/no-floating-promises": "error" },
  },
]);
