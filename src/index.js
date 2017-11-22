
import mongoose from 'mongoose';
import mongooseStore from 'cache-manager-mongoose';
import { createLogger } from 'claypot';
import { join } from 'path';
import importModules from 'import-modules';

const { connection } = mongoose;
mongoose.Promise = Promise;
const logger = createLogger('mongoose', 'green');

export default class MongooseClaypotPlugin {
	constructor(options = {}, { root, baseDir }) {
		this._name = options.name || 'mongoose';
		const schemaDir = join(baseDir || root, options.schemas || 'schemas');
		this._schemas = importModules(schemaDir);

		// model name to schema name
		// i.e. `{ myModelName: 'mySchemaName' }`
		this._namesMap = options.namesMap || {};

		if (!Object.keys(this._schemas).length) {
			logger.warn(
				'no schemas found. ' +
				`please make sure the "schema" value "${schemaDir}" is correct, ` +
				'and make sure schema files exist.',
			);
		}
	}

	registerDatabase(register) {

		register(this._name, {

			async connect(options) {
				const {
					host = '127.0.0.1',
					port = 27017,
					database,
					user,
					pass,
					...other,
				} = options;

				const userAndPass = user && pass ? `${user}:${pass}` : '';

				mongoose.connect(
					`mongodb://${userAndPass}@${host}:${port}/${database}`,
					{
						useMongoClient: true,
						promiseLibrary: global.Promise,
						...other,
					},
				);

				connection.on('error', ({ message }) => {
					logger.fatal('CONNECTION ERROR:', message);
				});

				connection.once('open', () => logger.info('connected'));
			},

			createCache(options) {
				return {
					...options,
					store: mongooseStore,
					mongoose,
				};
			},

			createModels: (names) => {
				const namesMap = this._namesMap;
				const models = names.reduce((models, name) => {
					const schemaName = namesMap[name] || name;
					const schema = this._schemas[schemaName];
					if (schema) {
						const modelName = (name + '').toLowerCase();
						const model = mongoose.model(modelName, schema.default || schema);
						models[name] = model;
						logger.trace(`"${modelName}" created`);
					}
					return models;
				}, {});

				return models;
			},

		});
	}

}
