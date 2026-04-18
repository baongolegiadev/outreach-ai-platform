import { Buffer } from 'node:buffer';

/** 1×1 transparent GIF (43 bytes). */
export const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  'base64',
);
