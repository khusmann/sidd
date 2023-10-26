#!/usr/bin/env node

import * as cfg from "./synth_config";

console.log(JSON.stringify(cfg.dataPackage().parse({}), null, 2));
