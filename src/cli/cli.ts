#!/usr/bin/env node

import { Parcel } from "@parcel/core";
import yargs from "yargs";
import { generateDataPackage } from "../synth/generator";
import { promises as fs } from "fs";
import { withTempFile, withTempDir } from "./cli_utils";
import { packageStats } from "../model/stats";
// import { deflate } from "pako";
// import { encode } from "base-64";
import { fromDataPackage, dataPackage } from "../model/frictionless";
import * as path from "path";

type GlobalConfig = {
  verbose: boolean;
};

type ServeCmdConfig = GlobalConfig & {
  pkgPath?: string;
  port: number;
};

type BuildCmdConfig = GlobalConfig & {
  pkgPath?: string;
  output: string;
  mode: "production" | "development";
};

const loadDataPackageStats = async (pkgPath?: string) => {
  if (pkgPath === undefined) {
    return packageStats(generateDataPackage());
  } else {
    const pkgFile = await fs.readFile(pkgPath, "utf8");
    const pkgDir = path.dirname(pkgPath);
    const pkg = dataPackage.parse(JSON.parse(pkgFile));
    return packageStats(fromDataPackage(pkg, pkgDir));
  }
};

const serveCmd = async <T extends ServeCmdConfig>(config: T) => {
  await withTempFile(async (statfile) => {
    const stats = await loadDataPackageStats(config.pkgPath);

    const bundler = new Parcel({
      entries: "./src/site/codebook.html",
      defaultConfig: "@parcel/config-default",
      serveOptions: {
        port: config.port,
      },
      hmrOptions: {
        port: config.port,
      },
      env: {
        SIDD_STATS: JSON.stringify(stats),
      },
    });

    console.log(`Serving sidd on http://localhost:${config.port}`);

    await bundler.watch((err, event) => {
      if (err !== undefined && err !== null) {
        // fatal error
        throw err;
      }
      if (event !== undefined) {
        if (event.type === "buildSuccess") {
          const bundles = event.bundleGraph.getBundles();
          console.log(
            `✨ Built ${bundles.length} bundles in ${event.buildTime}ms!`
          );
        } else if (event.type === "buildFailure") {
          console.log(event.diagnostics);
        }
      }
    });
  });
};

/*
const compressData = (data: string) => {
  const compressedData = deflate(data);

  const stringData = Array.from(compressedData)
    .map((x) => String.fromCharCode(x))
    .join("");

  const result = encode(stringData);
  return result;
};
*/

const buildCmd = async <T extends BuildCmdConfig>(config: T) => {
  await withTempDir(async (tempdir) => {
    const stats = await loadDataPackageStats(config.pkgPath);

    const bundler = new Parcel({
      entries: "./src/site/codebook.html",
      defaultConfig: "@parcel/config-default",
      mode: config.mode,
      defaultTargetOptions: {
        distDir: tempdir,
      },
      env: {
        SIDD_STATS: JSON.stringify(stats),
      },
    });

    const { bundleGraph, buildTime } = await bundler.run();
    const bundles = bundleGraph.getBundles();
    console.log(`✨ Built ${bundles.length} bundles in ${buildTime}ms!`);

    // TODO Use parcel filesystem instead:
    // https://parceljs.org/features/parcel-api/#file-system
    await fs.mkdir(path.dirname(config.output), { recursive: true });
    await fs.copyFile(path.join(tempdir, "codebook.html"), config.output);
  });
};

void yargs
  .scriptName("sidd")
  .usage("$0 <cmd> [args]")
  .options({
    verbose: {
      alias: "v",
      type: "boolean",
      default: false,
      describe: "Run with verbose logging",
    },
  })
  .command(
    "build [pkgPath] [options]",
    "build a Standalone Interactive Data Dictionary (sidd)",
    (yargs) =>
      yargs
        .positional("pkgPath", {
          type: "string",
          describe: "Path to a data package",
        })
        .options({
          output: {
            alias: "o",
            type: "string",
            default: "./build/codebook.html",
          },
          mode: {
            alias: "m",
            choices: ["production", "development"] as const,
            default: "development" as const,
          },
        }),
    buildCmd
  )
  .command(
    "serve [pkgPath] [options]",
    "start a sidd webserver for a data package",
    (yargs) =>
      yargs
        .positional("pkgPath", {
          type: "string",
          describe: "Path to a data package",
        })
        .options({
          port: {
            alias: "p",
            type: "number",
            default: 1234,
            describe: "Port to serve on",
          },
        }),
    serveCmd
  )
  .demandCommand(1, "Please specify a command")
  .help()
  .strict()
  .parseAsync();
