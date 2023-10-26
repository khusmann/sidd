#!/usr/bin/env node

import * as cfg from "./synth/config";

console.log(JSON.stringify(cfg.dataPackage().parse({}), null, 2));
