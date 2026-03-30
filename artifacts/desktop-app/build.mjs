import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runBuild() {
  await build({
    entryPoints: [path.join(__dirname, 'src/main.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: path.join(__dirname, 'dist/main.cjs'),
    format: 'cjs',
    external: ['electron'],
  });
  console.log('Build complete');
}

runBuild().catch((err) => {
  console.error(err);
  process.exit(1);
});
