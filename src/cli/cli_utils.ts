import { promises as fs } from "fs";
import * as path from "path";

const SIDD_TEMP_DIR = ".sidd_temp";

export const withTempFile = async <T>(fn: (file: string) => Promise<T>) =>
  await withTempDir(async (dir: string) => await fn(path.join(dir, "file")));

export const withTempDir = async <T>(fn: (dir: string) => Promise<T>) => {
  await fs.mkdir(SIDD_TEMP_DIR, { recursive: true });
  const dir = await fs.mkdtemp((await fs.realpath(SIDD_TEMP_DIR)) + path.sep);
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true });
  }
};
