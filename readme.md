# cacha [![Build Status](https://travis-ci.org/floatdrop/cacha.svg?branch=master)](https://travis-ci.org/floatdrop/cacha)

> Cache on file-system


## Install

```
$ npm install --save cacha
```


## Usage

```js
const Cache = require('cacha');
const cache = new Cacha('.my/cache');

cache.set('id', 'content');
//=> Promise

cache.get('id');
//=> Promise with 'content'
```


## API

### cacha(namespace, [options])

#### namespace

Type: `string`

Directory in HOME or TMP directory of current user.

If namespace begins with `/` it will be interpreted as absolute path.

#### options

##### ttl

Type: `Number`  
Default: `86400000`

How long (in milliseconds) keep entries in cache.


### cache.get(id, [opts])

### cache.getSync(id, [opts])

### cache.set(id, content, [opts])

### cache.setSync(id, content, [opts])

### cache.clean()

Removes outdated entries in cache.

## License

MIT © [Vsevolod Strukchinsky](http://github.com/floatdrop)
