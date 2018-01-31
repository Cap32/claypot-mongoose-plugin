import claypotMongoosePlugin from '../src';
import { startPure } from 'claypot';

describe('claypot mongoose plugin', function () {
	let app;

	afterEach(async function () {
		if (app) {
			for (const connection of Object.values(app.mongooseConnections)) {
				connection.close();
			}
			await app.close();
		}
		app = null;
	});

	test('will extend model', async function () {
		app = await startPure({
			plugins: [claypotMongoosePlugin],
			models: 'test/fixtures/models',
			schemas: 'test/fixtures/schemas',
			dbs: { test: { store: 'mongoose' } },
		});
		const { foo } = app.models;
		expect(foo.constructor.test.name).toBe('model');
	});
});
