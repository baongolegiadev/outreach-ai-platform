const PIXEL_TEMPLATE = (src: string): string =>
  `<img src="${encodeURI(src)}" alt="" width="1" height="1" style="display:block;border:0;width:1px;height:1px" />`;

export function buildOutboundHtmlWithOpenPixel(
  htmlBody: string,
  openTrackingToken: string | null,
  publicApiBaseUrl: string,
): string {
  if (!openTrackingToken) {
    return htmlBody;
  }
  const base = publicApiBaseUrl.replace(/\/$/, '');
  const pixelUrl = `${base}/track/opens/${openTrackingToken}`;
  return appendOpenTrackingPixel(htmlBody, pixelUrl);
}

/**
 * Appends a tracking pixel to HTML. If a `<body>` tag exists, inserts before `</body>`;
 * otherwise appends at the end.
 */
export function appendOpenTrackingPixel(html: string, pixelUrl: string): string {
  const pixel = PIXEL_TEMPLATE(pixelUrl);
  const lower = html.toLowerCase();
  const closeBody = lower.lastIndexOf('</body>');
  if (closeBody !== -1) {
    return `${html.slice(0, closeBody)}${pixel}${html.slice(closeBody)}`;
  }
  return `${html}${pixel}`;
}
