#!/usr/bin/env node

import { Parcel } from "@parcel/core";
import ThrowableDiagnostic from "@parcel/diagnostic";

import { generateDataPackage } from "./synth/generator";

const synthDataPackage = generateDataPackage();

console.log(JSON.stringify(synthDataPackage, null, 2));

const bundler = new Parcel({
  entries: "./src/codebook.html",
  defaultConfig: "@parcel/config-default",
  mode: "production",
  serveOptions: {
    port: 3000,
  },
});

const main = async () => {
  // await bundler.watch();
  try {
    const { bundleGraph, buildTime } = await bundler.run();
    const bundles = bundleGraph.getBundles();
    console.log(`✨ Built ${bundles.length} bundles in ${buildTime}ms!`);
  } catch (err) {
    if (err instanceof ThrowableDiagnostic) {
      console.log(err.diagnostics);
    } else {
      console.log(err);
    }
  }
};

void main();
