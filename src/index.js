
import mongoose from 'mongoose';
import mongooseStore from 'cache-manager-mongoose';
import { logger } from 'claypot';
import { join } from 'path';
import importModules from 'import-modules';

const { connection } = mongoose;
mongoose.Promise = Promise;

export default class MongooseClaypotPlugin {
	constructor(options = {}, { root }) {
		this._name = options.name || 'mongoose';
		const schemaDir = join(root, options.schemas || 'schemas');
		this._schemas = importModules(schemaDir);
	}

	registerDatabase(register) {

		register(this._name, {

			connect(options) {
				const {
					host = '127.0.0.1',
					port = 27017,
					database,
					...other,
				} = options;

				mongoose.connect(`mongodb://${host}:${port}/${database}`, other);
				connection.on('error', ({ message }) => {
					logger.fatal('[MONGODB CONNECTION ERROR]:', message);
				});
				connection.once('open', () => logger.info('mongodb connected.'));
			},

			createCache(options) {
				return {
					...options,
					store: mongooseStore,
					mongoose,
				};
			},

			createModels: (names) => {
				return names.reduce((models, name) => {
					const schema = this._schemas[name];
					if (schema) {
						const modelName = (name + '').toLowerCase();
						const model = mongoose.model(modelName, schema.default || schema);
						models[name] = model;
					}
					return models;
				}, {});
			},

		});
	}

}
