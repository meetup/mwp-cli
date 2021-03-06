const postcssPresetEnv = require('postcss-preset-env');
const swarmCustomPropertiesLegacy = require('swarm-constants/dist/js/customProperties.js')
	.customProperties;
const swarmCustomProperties = require('@meetup/swarm-constants/build/js/customProperties.js');

module.exports = {
	loader: 'postcss-loader',
	options: {
		ident: 'postcss',
		plugins: loader => [
			postcssPresetEnv({
				stage: 0, // most unstable features/stage, but most similar to postcss-cssnext
				browsers: ['last 2 versions', 'not ie <= 10'],
				features: {
					'custom-properties': false,
					'color-mod-function': false,
				},
			}),
			require('postcss-css-variables')({
				preserve: true,
				variables: {
					...swarmCustomPropertiesLegacy,
					...swarmCustomProperties,
				},
				preserveInjectedVariables: false,
			}),
			require('cssnano')({
				preset: 'default',
			}),
		],
	},
};
