/* tslint:disable no-console */

import * as colors from 'colorette';
import { IReq, IRes, Next } from './types';

/** Byte size units. Let's hope our requests never get above `kB` ;) */
const units = ['B', 'kB', 'MB', 'GB', 'TB'];

/**
 * Convert bytes into a human readable form.
 */
function humanizeSize(bytes: number): string {
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  if (index < 0) return '';
  return `${+(bytes / 1024 ** index).toFixed(2)} ${units[index]}`;
}

/**
 * Log server requests.
 */
export function log(req: IReq, res: IRes, next: Next) {
  const start = process.hrtime();
  const write = res.write.bind(res);
  let byteLength = 0;

  // monkey patch to calculate response byte size
  res.write = function writeFn(data) {
    if (data) byteLength += data.length;
    // @ts-ignore
    write(...arguments);
  };

  function writeLog() {
    const duration = process.hrtime(start);
    const { method, originalUrl, url } = req;
    const { statusCode } = res;
    /* prettier-ignore */
    const color = statusCode >= 400 ? 'red' : statusCode >= 300 ? 'yellow' : 'green';
    const timing = `${+(duration[1] / 1e6).toFixed(2)}ms`;
    const size = humanizeSize(byteLength);
    /* prettier-ignore */
    /* tslint:disable-next-line max-line-length */
    console.log(`» ${timing} ${colors[color](statusCode)} ${method} ${originalUrl || url} ${colors.cyan(size)}`);
  }
  res.once('finish', writeLog);
  res.once('error', writeLog);
  next();
}

/**
 * Parse raw request body data and convert it to JSON.
 */
export function parse(req: IReq, res: IRes, next: Next) {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });
  req.once('end', () => {
    req.rawBody = data;
    const contentType = req.headers['content-type'];
    if (contentType && contentType.indexOf('application/json') === 0) {
      req.body = JSON.parse(data);
    }
    next();
  });
}
