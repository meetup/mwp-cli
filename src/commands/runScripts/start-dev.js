const fs = require('fs');
const fork = require('child_process').fork;
const path = require('path');

const chalk = require('chalk');
const webpack = require('webpack');

const {
	getServerAppConfig,
	locales,
	paths,
} = require('../buildCommands/config');

const ready = {
	browserApp: false,
	serverApp: false,
	appServer: false,
};
let appServerProcess;

const log = message => console.log(chalk.yellow('>>'), message);

const getCompileLogger = type => (err, stats) => {
	const message = ready[type]
		? chalk.blue(`${type} updated`)
		: chalk.green(`${type} bundle built`);
	log(message);
};

function getSubdomain(packageConfig) {
	const { subdomain } = packageConfig;
	if (!subdomain) {
		throw new Error(
			chalk.red('You must supply config.subdomain in package.json')
		);
	}
	return subdomain;
}

const getServerAppArgs = locales => {
	return locales.map(locale => {
		const serverAppPath = path.resolve(
			paths.serverAppOutputPath,
			locale,
			'server-app'
		);
		return `--${locale}=${serverAppPath}`;
	});
};
/*
 * Start a new server child process
 *
 * This function assumes that the server app corresponding to
 * serverAppLang will be available at serverAppPath when
 * `reader.serverApp` is true
 */
const startServer = (packageConfig, locales) => {
	if (appServerProcess) {
		appServerProcess.kill();
		ready.appServer = false;
	}
	// Ignore the call if the serverApp is not ready
	if (!ready.serverApp || !ready.browserApp) {
		return;
	}
	const args = getServerAppArgs(locales);
	if (!appServerProcess) {
		args.push('--cold-start');
		args.push(`--host=${getSubdomain(packageConfig)}.dev.meetup.com`);
	}
	appServerProcess = fork(path.resolve(__dirname, '_app-server'), args);
	ready.appServer = true;
};

function run(packageConfig, locales) {
	log(chalk.blue('building app, using existing vendor bundle'));
	/*
	 * 1. Start the Webpack Dev Server for the Browser application bundle
	 */
	log(chalk.blue('building browser assets to memory'));
	const browserAppCompileLogger = getCompileLogger('browserApp');
	const wdsProcess = fork(path.resolve(__dirname, '_webpack-dev-server'), [
		'--locales',
		...locales,
	]);
	// the dev server compiler will send a message each time it completes a build
	wdsProcess.on('message', message => {
		browserAppCompileLogger();
		if (!ready.browerApp) {
			// this is the first build - we can attempt to start the app server.
			// no need to restart the server otherwise
			ready.browserApp = true;
			startServer(packageConfig, locales);
		}
	});

	/*
	 * 2. Start the Webpack watch-mode compiler for the Server application
	 *
	 * no need to check for errors/warnings in the stats because this build
	 * parallels the one done in the Webpack Dev Server, and WDS will print
	 * error messages whenever there is something wrong.
	 */
	log(
		chalk.blue(
			`building server rendering bundle to ${paths.serverAppOutputPath}`
		)
	);
	const serverAppCompileLogger = getCompileLogger('serverApp');
	const serverAppCompiler = webpack(locales.map(getServerAppConfig));
	serverAppCompiler.watch(
		{
			aggregateTimeout: 100,
			ignored: /build/,
		}, // watch options
		(err, stats) => {
			if (stats.hasErrors() && stats.toJson().errors[0].includes('trns/app/')) {
				console.error(chalk.red('Missing translated TRN modules'));
				console.warn(chalk.yellow('Try running `yarn build:trnModules` first'));
				wdsProcess.kill();
				if (appServerProcess) {
					appServerProcess.kill();
				}
				process.exit(1);
			}
			serverAppCompileLogger(err, stats);

			if (err) {
				throw err;
			}
			ready.serverApp = true;
			// 4. (Re)start the Node app server when Server application is (re)-built
			startServer(packageConfig, locales);
		}
	);

	/*
	 * 3. watch for server dep changes in order to restart
	 */
	fs.watchFile(`${process.cwd()}/scripts/app-server.js`, () =>
		startServer(packageConfig, locales)
	);
	fs.watchFile(
		`${process.cwd()}/node_modules/meetup-web-platform/lib/index.js`,
		() => startServer(packageConfig, locales)
	);
}

module.exports = run;

if (!module.parent) {
	run();
}
