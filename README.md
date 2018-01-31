# claypot-mongoose-plugin

[![Build Status](https://travis-ci.org/Cap32/claypot-mongoose-plugin.svg?branch=master)](https://travis-ci.org/Cap32/claypot-mongoose-plugin)

## Installing

```bash
$ yarn add claypot claypot-mongoose-plugin
```

## Usage

**Claypotfile.js**

```js
module.exports = {
    plugins: ['claypot-mongoose-plugin'],
    dbs: {
        foo: {
            store: 'mongoose',
            database: 'my_mongo_db',
            native_parser: true,
            user: '<USER>',
            pass: '<PASS>',
            authSource: 'admin',
            autoReconnect: true,
        },
    },
};
```

## License

MIT
