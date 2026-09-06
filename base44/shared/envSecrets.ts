export const secrets = {
  get(name: string) {
    return typeof process !== 'undefined' ? process.env[name] : undefined;
  }
};
