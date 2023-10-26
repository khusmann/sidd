#!/usr/bin/env node

import * as cfg from "./synth/config";

import * as gen from "./synth/generator";

const globalConfig = cfg.globalConfig.parse({});

const packageConfig = cfg.dataPackage(globalConfig).parse({});

const state = gen.randState();

const synthDataPackage = gen.dataPackage(packageConfig)(state);

console.log(JSON.stringify(synthDataPackage, null, 2));
