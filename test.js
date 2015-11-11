import fs from 'fs';
import test from 'ava';
import mockFs from 'mock-fs';
import homeOrTmp from 'home-or-tmp';
import Cacha from './';

mockFs({});

test('namespace is required', t => {
	t.throws(function () {
		Cacha();
	}, /namespace expected to be a string/);
	t.end();
});

test('sets entity in cache by absolute path', async t => {
	const cache = new Cacha('/.cacha');

	t.is(await cache.set('id1', '1'), '1');
	t.is(fs.readFileSync('/.cacha/id1', 'utf8'), '1');

	t.is(cache.setSync('id2', '2'), '2');
	t.is(fs.readFileSync('/.cacha/id2', 'utf8'), '2');
});

test('sets entity in cache by relative path', async t => {
	const cache = new Cacha('.cacha');

	t.is(await cache.set('id1', '1'), '1');
	t.is(fs.readFileSync(homeOrTmp + '/.cacha/id1', 'utf8'), '1');

	t.is(cache.setSync('id2', '2'), '2');
	t.is(fs.readFileSync(homeOrTmp + '/.cacha/id2', 'utf8'), '2');
});

test('gets entity', async t => {
	const cache = new Cacha('.cacha');

	t.is(await cache.set('id1', '1', 'utf8'), '1');
	t.is(await cache.get('id1', 'utf8'), '1');

	t.is(cache.setSync('id2', '2', 'utf8'), '2');
	t.is(cache.getSync('id2', 'utf8'), '2');
});

test('supports ttl', async t => {
	const cache = new Cacha('.cacha', {ttl: 0});

	t.is(await cache.set('id1', '1', 'utf8'), '1');

	await new Promise(resolve => setTimeout(resolve, 5));

	t.is(await cache.get('id1', 'utf8'), undefined);
});

test('clean', async t => {
	const cache = new Cacha('.cached', {ttl: 100});
	await cache.set('id1', '1');
	await cache.set('id2', '2');

	t.ok(await cache.get('id1'));
	t.ok(await cache.get('id2'));

	await new Promise(resolve => setTimeout(resolve, 200));

	cache.clean();

	t.is(await cache.get('id1'), undefined);
	t.is(await cache.get('id2'), undefined);
});
