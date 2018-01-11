const chalk = require('chalk');
const Rx = require('rxjs');
const txlib = require('./util');
const pullResourceTrns = require('./util/pullResourceTrns');
const gitHelpers = require('./util/gitHelpers');


const allTranslationsResource$ = Rx.Observable.of([txlib.ALL_TRANSLATIONS_RESOURCE]);

const getProjectResourcesList$ =
	txlib.resources$
		.flatMap(Rx.Observable.from)
		.filter(resource => resource !== txlib.ALL_TRANSLATIONS_RESOURCE);

/**
 * Kicks off process to pull an individual resources trns
 * @param  {String} resource resource slug to be used when we pull translations
 * @return {Observable} Observable of tx process
 */
const pullResource$ = (resource) => {
	console.log(chalk.cyan(`Starting tx:pull for '${resource}'`));
	return pullResourceTrns.pullResourceContent$(resource)
		.toArray() // wait until all content has been pulled before moving on to next tasks
		.do(() => console.log(chalk.green(`\nCompleted tx:pull for '${resource}'`)))
		.map(() => resource);
};

module.exports = {
	command: 'pullAll',
	description: 'Pull all translations from resources from Transifex, ordered by most recently updated',
	builder: yarg =>
		yarg.option({
			gitCommit: {
				alias: 'c',
				default: false
			},
		}),
	handler: argv => {
		txlib.checkEnvVars();
		console.log(chalk.magenta('Start pulling all resources process...'));

		Rx.Observable
			.merge(allTranslationsResource$, getProjectResourcesList$)
			.flatMap(pullResource$, 1)
			.flatMap(resource => {
				if (!argv.gitCommit) {
					return Rx.Observable.empty();
				}
				const commitMessage = `tx:pull for ${resource.replace(/-/g, '_')}`;
				return gitHelpers.commit$(commitMessage, `--no-verify`);
			})
			.subscribe(null, error => { throw error; }, () => console.log(chalk.green('All resources pulled.')));
	},
};
