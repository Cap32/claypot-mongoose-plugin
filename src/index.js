import mongoose from 'mongoose';
import { Schema, ensureLogger } from 'claypot';
import SkeelerMongoose from 'skeeler-mongoose';
import semverCompare from 'semver-compare';

const { connection } = mongoose;
mongoose.Promise = Promise;

export default class MongooseClaypotPlugin {
	constructor(options = {}) {
		this._logger = ensureLogger('mongoose', 'green');
		this._store = options.store || 'mongoose';
		this._noModel = options.enableModels === false;
		this._includeModels = options.includeModels || [];
		this._excludeModels = options.excludeModels || [];
		this._modelNamesMap = {};
		this._injectConnections =
			options.injectConnections || 'mongooseConnections';
	}

	willConnectDatabases(dbsMap, app) {
		const connections = {};
		for (const [key, db] of dbsMap) {
			if (db.store === this._store) {
				const {
					host = '127.0.0.1',
					port = 27017,
					database,
					user,
					pass,
					...other
				} = db.config;

				const userAndPass = user && pass ? `${user}:${pass}` : '';

				const connectOpions = {

					// useMongoClient: true,
					promiseLibrary: global.Promise,
					...other,
				};

				if (
					semverCompare(mongoose.version, '5.2.0') >= 0 &&
					connectOpions.useNewUrlParser !== false
				) {
					connectOpions.useNewUrlParser = true;
				}

				mongoose.connect(
					`mongodb://${userAndPass}@${host}:${port}/${database}`,
					connectOpions,
				);

				connection.on('error', ({ message }) => {
					this._logger.fatal('CONNECTION ERROR:', message);
				});

				connection.once('open', () => this._logger.info('connected'));
				connections[key] = connection;
			}
		}
		this._connections = app[this._injectConnections] = connections;
	}

	willResolveSchemas() {
		Schema.use('mongoose', new SkeelerMongoose());
	}

	didResolvedSchemas(schemas) {
		this._schemas = schemas;

		if (!Object.keys(schemas).length) {
			this._logger.warn('no schemas found.');
		}
	}

	willCreateModels(modelsMap) {
		if (this._noModel) {
			return;
		}

		const includes = this._includeModels;
		const excludes = this._excludeModels;
		const connections = this._connections;
		const namesMap = this._modelNamesMap;
		const schemas = this._schemas;

		for (const [name, Model] of modelsMap) {
			const shouldInclude = includes.length && !includes.includes(name);
			if (shouldInclude || excludes.includes(name)) {
				continue;
			}

			for (const key in connections) {
				if (!connections.hasOwnProperty(key)) {
					continue;
				}

				let schema = schemas[name];
				if (!schema) {
					continue;
				}
				else if (schema.default instanceof mongoose.Schema) {
					schema = schema.default;
				}
				else if (schema.mongoose instanceof mongoose.Schema) {
					schema = schema.mongoose;
				}
				else {
					continue;
				}

				const model = mongoose.model(name, schema);
				const prop = namesMap[key] || key;
				Model[prop] = model;
				this._logger.trace(`"${name}" created`);
			}
		}
	}
}
