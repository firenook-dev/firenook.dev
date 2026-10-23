// The build setting cf reads for a static site: where the built files are.
import { defineWranglerConfig } from 'wrangler/experimental-config';

export default defineWranglerConfig({
  assetsDirectory: './dist',
});
