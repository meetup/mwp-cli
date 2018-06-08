const { promisify } = require('util');
const request = require('request');

const TRAVIS_API_URL = 'https://api.travis-ci.com';
const _get = promisify(request.get);
const _post = promisify(request.post);
const get = (path, options = {}) => _get(`${TRAVIS_API_URL}${path}`, options);
const post = (path, options = {}) => _post(`${TRAVIS_API_URL}${path}`, options);

// Travis API needs auth token and repo to search for data
const getTravisApi = ({ token, repo }) => {
	const headers = {
		'Travis-API-Version': 3,
		Authorization: `token ${token}`,
	};
	return {
		build: {
			cancel: id =>
				post(`/build/${id}/cancel`)
					.then(({ body }) => {
						console.log(body);
					})
					.catch(console.error),
			// https://developer.travis-ci.com/resource/build#find
			get: id =>
				get(`/build/${id}`, { headers }).then(({ body }) =>
					JSON.parse(body)
				),
			latest: repo =>
				get(
					`/repo/${encodeURIComponent(
						repo
					)}/builds?state=started,created&sort_by=started_at:desc&limit=1`,
					{ headers }
				)
					.then(resp => JSON.parse(resp.body).builds)
					.then(builds => (builds.length > 0 ? builds[0] : null))
					.catch(console.error),
		},
	};
};

// make a function that will test if a second build started within the
// `minInterval` time between builds
const makeTestShortInterval = (build1, minInterval) => build2 => {
	if (!build2) {
		// nothing running
		false;
	}
	const start1 = new Date(build1.started_at);
	const start2 = new Date(build2.started_at);
	if (start2 - start1 > minInterval) {
		console.log(`Newer build ${build2.id} started at ${build2.started_at}`);
		return true;
	}
	// build2 started late enough that it
	return false;
};

module.exports = {
	command: 'status',
	description: 'check build status',
	builder: yargs =>
		yargs.options({
			autoCancel: {
				default: false,
				describe: 'Cancel the current build if a newer one exists',
			},
			id: {
				default: process.env.TRAVIS_BUILD_ID,
				demandOption: true,
				describe:
					'The build id to check - not the same as build number',
			},
			repo: {
				default: process.env.TRAVIS_REPO_SLUG,
				demandOption: true,
				describe: '{owner}/{repoName} for the build repo',
			},
			token: {
				default: process.env.TRAVIS_API_TOKEN,
				demandOption: true,
				describe: 'Token that will be used to auth with API',
			},
			minInterval: {
				default: 1000 * 60 * 15, // 15 min
				describe: 'Minimum time between builds in ms',
			},
		}),
	handler: argv => {
		const { autoCancel, id, token, repo, minInterval } = argv;
		const travisApi = getTravisApi({ token, repo });
		travisApi.build.get(id).then(build => {
			console.log(`Build ${id} started at ${build.started_at}`);
			console.log(`Status: ${build.state}`);
			if (!autoCancel) {
				// status reported, nothing else to do
				return;
			}
			// need to auto-cancel if there's a newer build started less than
			// `minInterval` after current build
			const testShortInterval = makeTestShortInterval(build, minInterval);
			travisApi.build
				.latest(repo)
				.then(testShortInterval)
				.then(
					isNewer =>
						isNewer ? travisApi.build.cancel(id) : Promise.resolve()
				);
		});
	},
};
