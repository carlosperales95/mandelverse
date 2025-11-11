/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
	root: true,
	ignorePatterns: [
		"dist/",
		"node_modules/",
		".eslintrc.js",
		"vite.config.js",
		"webpack.config.js"
	],
	overrides: [
		{
		files: ["*.config.js"],
		env: {
			node: true,
		},
		rules: {
			"no-undef": "off",
			"no-unused-vars": "off",
		},
	},
  ],
	extends: [
		"plugin:vue/vue3-recommended",
		"eslint:recommended",
		"@vue/eslint-config-typescript",
		"@vue/eslint-config-prettier/skip-formatting",
		"prettier",
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
