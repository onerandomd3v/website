import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  homepageSectionKeySchema,
  homepageSectionSchema,
} from './homepage-sections.js';

test('homepage section schemas accept approved section payloads', () => {
  const section = homepageSectionSchema.parse({
    sectionKey: 'hero',
    payload: {
      heading: 'Engineering software that works for Africa',
      body: 'Purpose-built software for African markets.',
      primaryCallToAction: {
        label: 'Contact us',
        href: '/contact',
      },
    },
  });

  assert.equal(section.sectionKey, 'hero');
});

test('homepage section schemas validate the contact payload', () => {
  assert.equal(
    homepageSectionSchema.safeParse({
      sectionKey: 'contact',
      payload: {
        heading: 'Contact CodedDevs',
        body: 'Reach the team.',
      },
    }).success,
    true,
  );
  assert.equal(
    homepageSectionSchema.safeParse({
      sectionKey: 'contact',
      payload: { heading: 'Contact CodedDevs' },
    }).success,
    false,
  );
});

test('homepage section schemas reject unknown section keys', () => {
  assert.equal(
    homepageSectionKeySchema.safeParse('testimonials').success,
    false,
  );
  assert.equal(
    homepageSectionSchema.safeParse({
      sectionKey: 'testimonials',
      payload: { heading: 'Testimonials' },
    }).success,
    false,
  );
});

test('homepage section schemas reject invalid and unknown payload fields', () => {
  assert.equal(
    homepageSectionSchema.safeParse({
      sectionKey: 'hero',
      payload: { heading: '', body: 'Valid body copy.' },
    }).success,
    false,
  );
  assert.equal(
    homepageSectionSchema.safeParse({
      sectionKey: 'about',
      payload: {
        heading: 'About CodedDevs',
        body: 'Company story.',
        unsupported: true,
      },
    }).success,
    false,
  );
});
