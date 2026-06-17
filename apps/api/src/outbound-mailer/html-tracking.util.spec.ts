import {
  appendOpenTrackingPixel,
  buildOutboundHtmlWithOpenPixel,
} from './html-tracking.util';

describe('html-tracking.util', () => {
  describe('appendOpenTrackingPixel', () => {
    it('inserts before closing body when present', () => {
      const html = '<html><body><p>x</p></body></html>';
      const out = appendOpenTrackingPixel(html, 'https://api.example/track/opens/tok');
      expect(out).toContain('</p>');
      expect(out.indexOf('track/opens/tok')).toBeLessThan(out.toLowerCase().indexOf('</body>'));
    });

    it('appends when body is missing', () => {
      const html = '<p>plain</p>';
      const out = appendOpenTrackingPixel(html, 'https://api.example/track/opens/tok');
      expect(out).toContain('<img src="https://api.example/track/opens/tok"');
      expect(out.startsWith('<p>plain</p>')).toBe(true);
    });
  });

  describe('buildOutboundHtmlWithOpenPixel', () => {
    it('returns original html when token is null', () => {
      expect(buildOutboundHtmlWithOpenPixel('<p>a</p>', null, 'https://x/')).toBe('<p>a</p>');
    });

    it('strips trailing slash from base URL', () => {
      const out = buildOutboundHtmlWithOpenPixel(
        '<p>a</p>',
        'deadbeef',
        'https://api.example/',
      );
      expect(out).toContain('https://api.example/track/opens/deadbeef');
      expect(out).not.toContain('https://api.example//track');
    });
  });
});
