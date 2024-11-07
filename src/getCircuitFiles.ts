const files = import.meta.glob('./circuit/**/*.ts', { query: '?raw', import: 'default' });

export default async function getCircuitFiles() {
  const circuitFiles: Record<string, string> = {};

  for (const [path, get] of Object.entries(files)) {
    circuitFiles[path.slice(2)] = (await get()) as string;
  }

  return circuitFiles;
}
