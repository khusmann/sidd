const getElementOrThrow = (id: string) => {
  const elem = document.getElementById(id);
  if (elem === null) {
    throw new Error(`Could not find element with id ${id}`);
  }
  return elem;
};

export { getElementOrThrow };
