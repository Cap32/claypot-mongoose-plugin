
import mongoose from 'mongoose';
// import mongooseStore from 'cache-manager-mongoose';
import { logger } from 'claypot';
import { join } from 'path';
import importModules from 'import-modules';

const { connection } = mongoose;

export default class MongooseClaypotPlugin {
	constructor(options = {}, { root }) {
		this._name = options.name || 'mongoose';
		this._schemasDir = join(root, options.schemas || 'schemas');
	}

	connectDB(register) {
		register(
			this._name,
			({
				host = '127.0.0.1',
				port = 27017,
				database,
				...other,
			}) => {
				mongoose.connect(`mongodb://${host}:${port}/${database}`, other);

				connection.on('error', ({ message }) => {
					logger.fatal('[MONGODB CONNECTION ERROR]:', message);
				});

				connection.once('open', () => logger.info('mongodb connected.'));

			},
			// mongooseStore,
		);
	}

	registerModels(register, names) {
		const schemas = importModules(this._schemasDir);
		register(
			this._name,
			names.reduce((models, name) => {
				const schema = schemas[name];
				if (schema) {
					const modelName = (name + '').toLowerCase();
					const model = mongoose.model(modelName, schema || schema.default);
					models[name] = model;
				}
				return models;
			}, {}),
		);
	}
}
