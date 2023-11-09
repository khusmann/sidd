#!/usr/bin/env node
import * as fs from "fs";
import { DATA_SETINAL } from "../setinal";
import { fromDataPackage, dataPackage } from "../model/frictionless";
import { packageStats } from "../model/stats";
import { deflate } from "pako";
import { encode } from "base-64";
import * as path from "path";
import yargs from "yargs";

const CODEBOOK_TEMPLATE = path.join(__dirname, "../../build/codebook.html");

const compressObj = (data: any) => {
  const compressedData = deflate(JSON.stringify(data));

  const stringData = Array.from(compressedData)
    .map((x) => String.fromCharCode(x))
    .join("");

  const result = encode(stringData);
  return result;
};

yargs
  .scriptName("sidd")
  .options({
    output: {
      alias: "o",
      type: "string",
      default: "./codebook.html",
    },
  })
  .command(
    "$0 <pkgPath>",
    "Generate a codebook from a data package",
    (yargs) =>
      yargs.positional("pkgPath", {
        type: "string",
        describe: "Path to a data package",
        demandOption: true,
      }),
    (args) => {
      const codebookTemplate = fs.readFileSync(CODEBOOK_TEMPLATE, "utf-8");

      const pkgText = fs.readFileSync(args.pkgPath, "utf-8");

      const pkg = fromDataPackage(
        dataPackage.parse(JSON.parse(pkgText)),
        path.dirname(args.pkgPath)
      );

      const stats = packageStats(pkg);

      const codebook = codebookTemplate.replace(
        DATA_SETINAL,
        compressObj(stats)
      );

      fs.writeFileSync(args.output, codebook);
    }
  )
  .help()
  .strict()
  .parseSync();
