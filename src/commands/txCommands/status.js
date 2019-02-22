const txlib = require('./util');
const chalk = require('chalk');

module.exports = {
	command: 'status',
	description: 'get translation status of resources (branches)',
	handler: argv => {
		console.log(chalk.blue('checking resource status'));

		txlib
			.getTfxResourcesIncomplete()
			.then(resources => {
				if (resources.length) {
					console.log('\nIncomplete Resources');
					resources.forEach(([branchName, percentage]) =>
						console.log(branchName, percentage)
					);
				}
			})
			.then(txlib.getTfxResourcesComplete)
			.then(resources => {
				if (resources.length) {
					console.log('\nComplete Resources');
					resources.forEach(console.log);
				}
			});
	},
};
