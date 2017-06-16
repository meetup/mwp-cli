const fs = require('fs');
const convict = require('convict');
const path = require('path');

/**
 * This module populates build time configuration data
 */

const schema = {
	// asset server is needed for dev build in order to set up HMR server
	asset_server: {
		host: {
			format: String,
			default: 'beta2.dev.meetup.com',
			env: 'ASSET_SERVER_HOST',
		},
		path: {
			format: String,
			default: '/static',
			env: 'ASSET_PATH',
		},
		port: {
			format: 'port',
			default: 8001, // must be 443 for prod
			arg: 'asset-port',
			env: process.env.NODE_ENV !== 'test' && 'ASSET_SERVER_PORT', // don't read env in tests
		},
		protocol: {
			format: String,
			default: 'http',
			env: 'ASSET_SERVER_PROTOCOL',
		},
		key_file: {
			format: String,
			default: '',
			env: 'ASSET_KEY_FILE',
		},
		crt_file: {
			format: String,
			default: '',
			env: 'ASSET_CRT_FILE',
		},
	},
	env: {
		format: ['production', 'development', 'test'],
		default: 'development',
		env: 'NODE_ENV',
	},
	disable_hmr: {
		format: Boolean,
		default: false,
		env: 'DISABLE_HMR',
	},
	isDev: {
		format: Boolean,
		default: true,
	},
	isProd: {
		format: Boolean,
		default: false,
	},
};
const config = convict(schema);

const configPath = path.resolve(
	process.cwd(),
	`config.${config.get('env')}.json`
);

const { asset_server } = fs.existsSync(configPath) ? require(configPath) : {};
if (asset_server) {
	config.load({ asset_server });
}

config.set('isProd', config.get('env') === 'production');
config.set('isDev', config.get('env') === 'development');

const assetConf = config.get('asset_server');

if (
	assetConf.protocol === 'https' &&
	(!fs.existsSync(assetConf.key_file) || !fs.existsSync(assetConf.crt_file))
) {
	throw new Error('Missing HTTPS cert or key!');
}

config.validate();

module.exports = {
	schema,
	config,
	properties: config.getProperties(),
};
