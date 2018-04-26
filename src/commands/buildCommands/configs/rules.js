const path = require('path');
const { babel, paths } = require('mwp-config');
const customProperties = require('swarm-constants/dist/js/customProperties.js').customProperties;

module.exports = {
	scssModule: {
		test: /\.module\.scss$/,
		include: [paths.srcPath],
		use: [
			'isomorphic-style-loader',
			{
				loader: 'css-loader',
				options: {
					importLoaders: 2,
					modules: true,
					localIdentName: '_[name]_[local]__[hash:base64:5]',
					minimize: true,
				},
			},
			{
				loader: 'postcss-loader',
				options: {
					ident: 'postcss',
					plugins: loader => [
						require('postcss-cssnext')({
							browsers: ['last 2 versions', 'not ie <= 10'],
							features: {
								customProperties: false,
								colorFunction: false,
							},
						}),
						require('postcss-css-variables')({
							preserve: true,
							variables: customProperties,
						}),
					],
				},
			},
			'sass-loader',
		],
	},
	css: {
		test: /\.css$/,
		include: [path.resolve(paths.src.asset, 'css')],
		use: ['style-loader', 'css-loader'],
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
						plugins: babel.plugins.browser,
						presets: babel.presets.browser,
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
				plugins: babel.plugins.server,
				presets: babel.presets.server,
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