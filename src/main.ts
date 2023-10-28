import { generateDataPackage } from "./synth/generator";
import { setup } from "./table";

setup();

// Test synth data generation

const synthDataPackage = generateDataPackage();

const frame = new dfd.DataFrame(synthDataPackage.resources[0].data);

frame.print();
