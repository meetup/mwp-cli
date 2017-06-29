const chalk = require('chalk');
const path = require('path');
const webpack = require('webpack');
const addLocalesOption = require('../../util/addLocalesOption');

const {
	getBrowserAppConfig,
	getRelativeBundlePath,
	paths,
} = require('./config');

// set up function for getting the built bundle filename
const getBundlePath = getRelativeBundlePath('app', paths.browserAppOutputPath);

const buildBrowserApp = localeCode => {
	console.log(
		chalk.blue(`building browser app (${chalk.yellow(localeCode)})...`)
	);
	const config = getBrowserAppConfig(localeCode);
	webpack(config, (err, stats) => {
		const relativeBundlePath = getBundlePath(stats, localeCode);
		console.log(chalk.blue(`built ${relativeBundlePath}`));
	});
};

module.exports = {
	command: 'browser',
	aliases: 'client',
	description: 'build the client-side renderer bundle',
	builder: yargs => addLocalesOption(yargs),
	handler: argv => {
		console.log(
			chalk.blue('building browser bundle using current vendor bundles')
		);
		// TODO : fork a new child process?
		argv.locales.forEach(buildBrowserApp);
	},
};
