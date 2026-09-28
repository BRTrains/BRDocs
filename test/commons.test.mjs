import assert from 'node:assert/strict';
import test from 'node:test';
import { isOpenLicense, selectCommonsImage } from '../server.mjs';

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
    { title: 'File:Copyright.jpg', imageinfo: [{ extmetadata: { LicenseShortName: { value: 'All rights reserved' } } }] },
    { title: 'File:Train.jpg', imageinfo: [{ extmetadata: { LicenseShortName: { value: 'CC BY-SA 4.0' } } }] },
  ]);
  assert.equal(image.title, 'File:Train.jpg');
});

test('returns no image when search results have no open license', () => {
  assert.equal(selectCommonsImage([{ imageinfo: [{ extmetadata: { LicenseShortName: { value: 'Fair use' } } }] }]), null);
});
