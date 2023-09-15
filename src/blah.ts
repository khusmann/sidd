const hello = () => {
  return process.env.SENTRY_ASDF;
}

console.log(hello())
content.innerHTML = hello();

document.write("hello");

export { hello } ;
