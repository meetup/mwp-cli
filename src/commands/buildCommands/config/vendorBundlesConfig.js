const ManifestPlugin = require('webpack-manifest-plugin');
const webpack = require('webpack');
const path = require('path');
const settings = require('./settings');
const buildConfig = require('meetup-web-platform/lib/util/config/build')
	.default;

const dllName = '[name]_lib';

const config = {
	entry: {
		react: [
			'react',
			'react-dom',
			'react-facebook-login',
			'react-helmet',
			'react-intl',
			'react-redux',
			'react-router',
			'react-router-dom',
			'react-waypoint',
		],
		vendor: [
			'autosize',
			'consolidated-events',
			'fbjs',
			'flatpickr',
			'history',
			'intl-messageformat',
			'intl-relativeformat',
			'prop-types',
			'qs',
			'redux',
			'rison',
		],
	},
	output: {
		filename: '[name].[chunkhash].js',
		path: settings.browserAppOutputPath,
		// The name of the global variable which the library's
		// require() function will be assigned to
		library: dllName,
	},

	plugins: [
		new webpack.EnvironmentPlugin({
			NODE_ENV: 'development', // required for prod build of React
		}),
		new webpack.DllPlugin({
			// The path to the manifest file which maps between
			// modules included in a bundle and the internal IDs
			// within that bundle
			path: path.resolve(
				settings.browserAppOutputPath,
				'[name]-dll-manifest.json'
			),
			// The name of the global variable which the library's
			// require function has been assigned to. This must match the
			// output.library option above
			name: dllName,
		}),
		new ManifestPlugin(),
	],
};

if (buildConfig.isProd) {
	config.plugins = config.plugins.concat(settings.prodPlugins);
}

module.exports = config;
