import fs from 'fs';
import path from 'path';

export const getArg = (key: string) => {
  const argv = process.argv.slice(2);
  const cliEnv = argv.find((x) => x.indexOf(`--${key}=`) !== -1)?.split(`--${key}=`)[1];
  return process.env[key] || cliEnv;
};

export function logToFile(o: any, options?: { name }) {
  if (process.env.logToFile !== 'yes') {
    return;
  }

  if (!o) {
    return;
  }

  const timestamp = Date.now();
  const str = typeof o === 'string' ? o : JSON.stringify(o, null, 2);
  const name = options?.name ? options.name + '-' : '';
  fs.writeFileSync(path.resolve(__dirname, `../../.temp.log/${name}${timestamp}.json`), str);
}
