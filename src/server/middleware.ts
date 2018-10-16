/* tslint:disable no-console */

import * as colors from 'colorette';
import { IReq, IRes, Next } from './types';

/**
 * Log server requests.
 */
export function log(req: IReq, res: IRes, next: Next) {
  const start = process.hrtime();

  function writeLog() {
    const durration = process.hrtime(start);
    const { method, originalUrl, url } = req;
    const { statusCode } = res;
    const color = statusCode >= 400 ? 'red' : statusCode >= 300 ? 'yellow' : 'green';
    const timing = `${(durration[1] / 1e6).toFixed(2)}ms`;
    console.log(`» ${timing} ${colors[color](statusCode)} ${method} ${originalUrl || url}`);
  }
  res.on('finish', writeLog);
  res.on('error', writeLog);
  next();
}

/**
 * Parse raw request body data and convert it to JSON.
 */
export function parse(req: IReq, res: IRes, next: Next) {
  let data = '';
  req.on('data', (chunk) => {
    data += chunk;
  });
  req.on('end', () => {
    req.rawBody = data;
    if (req.headers['content-type']
      && req.headers['content-type'].indexOf('application/json') !== -1
      && data
      && (data.indexOf('{') === 0 || data.indexOf('[') === 0)
    ) {
      req.body = JSON.parse(data);
    }
    next();
  });
}
