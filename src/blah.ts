import { generateDataPackage } from "./synth/generator";

const synthDataPackage = generateDataPackage();

console.log(JSON.stringify(synthDataPackage, null, 2));

const hello = () => {
  return process.env.SENTRY_ASDF;
};

console.log(hello());
// content.innerHTML = hello();

// document.write("hello");

export { hello };
