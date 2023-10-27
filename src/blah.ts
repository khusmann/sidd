import { generateDataPackage } from "./synth/generator";

// import * as dfd from "danfojs";

const synthDataPackage = generateDataPackage();

const frame = new dfd.DataFrame(synthDataPackage.resources[0].data);

console.log("hello");
console.log(frame);

const hello = () => {
  return process.env.SENTRY_ASDF;
};

console.log(hello());
// content.innerHTML = hello();

// document.write("hello");

export { hello };
