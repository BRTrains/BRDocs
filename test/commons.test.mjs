import assert from 'node:assert/strict';
import test from 'node:test';
import { isOpenLicense, selectCommonsImage, renderCommonsMarkup, commonsSearchQuery } from '../server.mjs';

test('accepts only Wikimedia Commons open licenses', () => {
  assert.equal(isOpenLicense('CC BY-SA 4.0'), true);
  assert.equal(isOpenLicense('CC BY 3.0'), true);
  assert.equal(isOpenLicense('Public domain'), true);
  assert.equal(isOpenLicense('CC BY-NC 4.0'), false);
  assert.equal(isOpenLicense('All rights reserved'), false);
  assert.equal(isOpenLicense('Fair use'), false);
});

test('selects the first suitable openly licensed image', () => {
  const image = selectCommonsImage([
    { title: 'File:Copyright.jpg', imageinfo: [{ thumburl: 'https://example.test/copyright.jpg', extmetadata: { LicenseShortName: { value: 'All rights reserved' } } }] },
    { title: 'File:Train.jpg', imageinfo: [{ thumburl: 'https://example.test/train.jpg', extmetadata: { LicenseShortName: { value: 'CC BY-SA 4.0' } } }] },
  ]);
  assert.equal(image.title, 'File:Train.jpg');
  assert.equal(selectCommonsImage([{ title: 'File:Train.jpg', imageinfo: [{ extmetadata: { LicenseShortName: { value: 'CC BY-SA 4.0' } }, thumburl: 'https://example.test/train.jpg' }] }], ['File:Train.jpg']), null);
});

test('returns no image when search results have no open license', () => {
  assert.equal(selectCommonsImage([{ imageinfo: [{ extmetadata: { LicenseShortName: { value: 'Fair use' } } }] }]), null);
});

test('renders Commons attribution markup safely', () => {
  const output = renderCommonsMarkup('The uploader was <a href="https://example.test/user" class="extiw">Pritch</a>. <script>alert(1)</script>');
  assert.equal(output, 'The uploader was <a href="https://example.test/user" target="_blank" rel="noreferrer">Pritch</a>. alert(1)');
});

test('searches OpenTTE vehicles as Thomas characters rather than real locomotives', () => {
  assert.equal(commonsSearchQuery({ name: 'OpenTTE2' }, { name: 'James the Red Engine', based_on: 'Furness Railway D5' }), 'Thomas the Tank Engine James the Red Engine');
});
