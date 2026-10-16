import { describe, it, expect } from 'vitest';
import { cleanTitle, siteName, pathOf } from '@/lib/url';

describe('link titles', () => {
  it('splits "Name | Tagline | Site" and drops descriptions that repeat it', () => {
    const t = cleanTitle('Himanshu Kumar | Experienced Full Stack Software Engineer | Portfolio website built with React.js', { site: 'himanshu.dev', description: 'Himanshu Kumar | Experienced Full Stack Software Engineer | Portfolio' });
    expect(t.title).toBe('Himanshu Kumar');
    expect(t.tagline).toBe('Experienced Full Stack Software Engineer · Portfolio website built with React.js');
    expect(t.description).toBeUndefined();
  });
  it('finds the tagline inside a description that repeats the title', () => {
    expect(cleanTitle('Himanshu Kumar', { site: 'himanshu.dev', description: 'Himanshu Kumar | Experienced Full Stack Software Engineer | Portfolio' }))
      .toEqual({ title: 'Himanshu Kumar', tagline: 'Experienced Full Stack Software Engineer · Portfolio', description: undefined });
  });
  it('drops the site name from "Post - Site"', () => {
    expect(cleanTitle('Why I write by hand - Substack', { site: 'Substack' })).toEqual({ title: 'Why I write by hand', tagline: undefined, description: undefined });
  });
  it('leaves a plain title alone and keeps a real description', () => {
    expect(cleanTitle('Studio letters', { description: 'New work, once a month' })).toEqual({ title: 'Studio letters', tagline: undefined, description: 'New work, once a month' });
  });
  it('names sites and paths', () => {
    expect(siteName('https://himanshu.substack.com/p/x')).toBe('Substack');
    expect(siteName('https://shop.example.com')).toBe('example.com');
    expect(siteName('https://himanshu.dev')).toBe('himanshu.dev');
    expect(pathOf('https://himanshu.substack.com/p/by-hand?utm=1')).toBe('/p/by-hand');
  });
});
