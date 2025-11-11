/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
	root: true,
	extends: [
		"plugin:vue/vue3-recommended",
		"eslint:recommended",
		"@vue/eslint-config-typescript",
		"@vue/eslint-config-prettier/skip-formatting",
		"prettier",
	],
	overrides: [
		{
			files: ["cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}"],
			extends: ["plugin:cypress/recommended"],
		},
	],
	parserOptions: {
		ecmaVersion: "latest",
	},
	plugins: ["prettier"],
	rules: {
		"prettier/prettier": "error",
		"vue/no-unused-emit-declarations": "warn",
    'vue/multi-word-component-names': 'off',
    'vue/require-default-prop': 'off',
    'vue/require-prop-types': 'off',
    'vue/no-v-html': 'off',
    'vue/attribute-hyphenation': 'off',
    'vue/v-on-event-hyphenation': 'off',
	},
};
