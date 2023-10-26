#!/usr/bin/env node

import { generateDataPackage } from "./synth/generator";

const synthDataPackage = generateDataPackage();

console.log(JSON.stringify(synthDataPackage, null, 2));
