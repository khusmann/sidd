const getElementOrThrow = (id: string) => {
  const elem = document.getElementById(id);
  if (elem === null) {
    throw new Error(`Could not find element with id ${id}`);
  }
  return elem;
};

const setElementHtmlOrThrow = (id: string, html: string) => {
  const elem = getElementOrThrow(id);
  elem.innerHTML = html;
};

export { getElementOrThrow, setElementHtmlOrThrow };
