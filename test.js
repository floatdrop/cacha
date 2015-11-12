import fs from 'fs';
import test from 'ava';
import mockFs from 'mock-fs';
import homeOrTmp from 'home-or-tmp';
import Cacha from './';

function time(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

mockFs({});

test('namespace is required', t => {
	t.throws(function () {
		Cacha();
	}, /namespace expected to be a string/);
	t.end();
});

test('sets entity in cache by absolute path', async t => {
	const cache = new Cacha('/.absolutly');

	t.is(await cache.set('id1', '1'), '1');
	t.is(fs.readFileSync('/.absolutly/id1', 'utf8'), '1');

	t.is(cache.setSync('id2', '2'), '2');
	t.is(fs.readFileSync('/.absolutly/id2', 'utf8'), '2');
});

test('sets entity in cache by relative path', async t => {
	const cache = new Cacha('.relativly');

	t.is(await cache.set('id1', '1'), '1');
	t.is(fs.readFileSync(homeOrTmp + '/.relativly/id1', 'utf8'), '1');

	t.is(cache.setSync('id2', '2'), '2');
	t.is(fs.readFileSync(homeOrTmp + '/.relativly/id2', 'utf8'), '2');
});

test('gets entity', async t => {
	const cache = new Cacha('.gets');

	t.is(await cache.set('id1', '1', 'utf8'), '1');
	t.is(await cache.get('id1', 'utf8'), '1');

	t.is(cache.setSync('id2', '2', 'utf8'), '2');
	t.is(cache.getSync('id2', 'utf8'), '2');
});

test('supports ttl', async t => {
	const cache = new Cacha('.ttl', {ttl: 10});

	t.is(await cache.set('id1', '1', 'utf8'), '1');

	await time(100);

	t.is(await cache.get('id1', 'utf8'), undefined);
});

test('clean', async t => {
	const cache = new Cacha('.clean', {ttl: 50});
	await cache.set('id1', '1');
	await cache.set('id2', '2');

	t.ok(await cache.get('id1'));
	t.ok(await cache.get('id2'));

	await time(100);

	cache.clean();

	t.is(await cache.get('id1'), undefined);
	t.is(await cache.get('id2'), undefined);
});

test('updates atime', async t => {
	const cache = new Cacha('/mtime');

	t.is(await cache.set('id1', '1', 'utf8'), '1');
	const oldTime = Number(fs.statSync('/mtime/id1').atime);

	await time(100);

	t.is(await cache.get('id1', 'utf8'), '1');
	const newTime = Number(fs.statSync('/mtime/id1').atime);

	t.ok(newTime > oldTime)
});
