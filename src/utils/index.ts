export const getArg = (key: string) => {
  const argv = process.argv.slice(2);
  return argv.find((x) => x.indexOf(`--${key}=`) !== -1)?.split(`--${key}=`)[1];
};
