import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Browser evidence is temporary and never part of the repository or published package.
export const browserTestOutputDirectory = await mkdtemp(join(tmpdir(), "app4you-cookie-banner-"));
