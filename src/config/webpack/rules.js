const path = require('path');
const paths = require('../paths');
const babelrc = require('../babel');

module.exports = {
	css: {
		test: /\.css$/,
		include: [path.resolve(paths.src.asset, 'css')],
		use: [
			'style-loader',
			{
				loader: 'css-loader',
				options: {
					modules: true,
					importLoaders: 1,
				}
			},
			{
				loader: 'postcss-loader',
				options: {
					config: {
						path: path.resolve(paths.src.config, 'webpack')
					}
				},
			}
		],
	},
	js: {
		hot: {
			test: /\.jsx?$/,
			use: ['react-hot-loader/webpack'],
			include: [paths.src.browser.app, paths.packages.webComponents.src],
			exclude: paths.src.asset,
		},
		browser: {
			// standard ES5 transpile through Babel
			test: /\.jsx?$/,
			include: [paths.src.browser.app, paths.packages.webComponents.src],
			exclude: paths.src.asset,
			use: [
				{
					loader: 'babel-loader',
					options: {
						cacheDirectory: true,
						plugins: babelrc.plugins.browser,
						presets: babelrc.presets.browser,
					},
				},
			],
		},
		server: {
			test: /\.jsx?$/,
			include: [paths.src.server.app, paths.packages.webComponents.src],
			loader: 'babel-loader',
			options: {
				cacheDirectory: true,
				plugins: babelrc.plugins.server,
				presets: babelrc.presets.server,
			},
		},
	},
	file: {
		test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|mp4|m4a|aac|oga)$/,
		loader: 'file-loader',
	},
	raw: {
		test: /\.inc?$/,
		loader: 'raw-loader',
	},
};
