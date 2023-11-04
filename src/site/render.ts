import * as d3 from "d3";
import type {
  Variable,
  VariableStats,
  CategoricalVariableStats,
  ContinuousVariableStats,
} from "../model/stats";
import { getElementOrThrow } from "./utils";

// Bug workaround: https://github.com/parcel-bundler/parcel/issues/8792
console.log(d3);

type ViewerDimensions = {
  width: number;
  height: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
};

const missingnessViewer = (currVar: Variable<VariableStats>) => {
  const { width, height, marginTop, marginBottom } = getDimensions();

  const missingness = currVar.missingness;
  const svg = d3.create("svg").attr("width", width).attr("height", height);

  const maxCount =
    d3.max(missingness, (d: any) => d.count as number) ??
    Number.MAX_SAFE_INTEGER;

  const x = d3
    .scaleLinear()
    .domain([0, maxCount])
    .range([0, width / 3]);

  const y = d3
    .scaleBand()
    .range([marginTop, height - marginBottom])
    .domain(missingness.map((d: any) => `${d.label}`))
    .padding(0.1);

  svg
    .append("g")
    .attr("transform", `translate(${width / 3},0)`)
    .call(d3.axisLeft(y));

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "bottom")
    //          .style("font-size", "10px")
    .text(`${currVar.name} (missingness)`);

  const bars = svg
    .selectAll("myRect")
    .data(missingness)
    .enter()
    .append("g")
    .attr("class", "bar")
    .attr("transform", `translate(${width / 3 + 5},0)`);

  bars
    .append("rect")
    .attr("x", x(0))
    .attr("y", (d: any) => y(`${d.label}`) ?? 0)
    .attr("width", (d: any) => x(d.count))
    .attr("height", y.bandwidth());

  bars
    .append("text")
    .text((d: any) => `${d.count} (${d3.format("0.2f")(d.pct * 100)}%)` ?? 0)
    .attr("y", (d: any) => (y(`${d.label}`) ?? 0) + y.bandwidth() / 2 + 5)
    .attr("x", (d: any) => x(d.count) + 5)
    .style("text-anchor", "left")
    .style("font-size", "10px");

  return svg;
};

const codedViewer = (currVar: Variable<CategoricalVariableStats>) => {
  const { width, height, marginTop, marginBottom } = getDimensions();

  const stats = currVar.stats;

  const svg = d3.create("svg").attr("width", width).attr("height", height);

  const maxCount =
    d3.max(stats.items, (d: any) => d.count as number) ??
    Number.MAX_SAFE_INTEGER;

  const x = d3
    .scaleLinear()
    .domain([0, maxCount])
    .range([0, width / 3]);

  const y = d3
    .scaleBand()
    .range([marginTop, height - marginBottom])
    .domain(stats.items.map((d: any) => `${d.label} (${d.value})`))
    .padding(0.1);

  svg
    .append("g")
    .attr("transform", `translate(${width / 3},0)`)
    .call(d3.axisLeft(y));

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "bottom")
    //          .style("font-size", "10px")
    .text(currVar.name);

  const bars = svg
    .selectAll("myRect")
    .data(stats.items)
    .enter()
    .append("g")
    .attr("class", "bar")
    .attr("transform", `translate(${width / 3 + 5},0)`);

  bars
    .append("rect")
    .attr("x", x(0))
    .attr("y", (d: any) => y(`${d.label} (${d.value})`) ?? 0)
    .attr("width", (d: any) => x(d.count))
    .attr("height", y.bandwidth());

  bars
    .append("text")
    .text((d: any) => `${d.count} (${d3.format("0.2f")(d.pct * 100)}%)` ?? 0)
    .attr(
      "y",
      (d: any) => (y(`${d.label} (${d.value})`) ?? 0) + y.bandwidth() / 2 + 5
    )
    .attr("x", (d: any) => x(d.count) + 5)
    .style("text-anchor", "left")
    .style("font-size", "10px");

  return svg;
};

const numericViewer = (currVar: Variable<ContinuousVariableStats>) => {
  const { width, height, marginTop, marginBottom, marginLeft, marginRight } =
    getDimensions();

  const stats = currVar.stats;

  const x = d3
    .scaleLinear()
    .domain([stats.min, stats.max])
    .range([marginLeft, width - marginRight]);

  const maxCount =
    d3.max(stats.freqs, (d: any) => d.count as number) ??
    Number.MAX_SAFE_INTEGER;

  const y = d3
    .scaleLinear()
    .domain([0, maxCount])
    .range([height - marginBottom, marginTop + 30]);

  // Create the SVG container.
  const svg = d3.create("svg").attr("width", width).attr("height", height);

  const formattedMean = stats.mean.toPrecision(2);
  const formattedSd = stats.sd.toPrecision(2);
  const formattedMin = stats.min.toPrecision(2);
  const formattedMax = stats.max.toPrecision(2);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", marginTop + 10)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "top")
    .style("font-size", "12px")
    .text(`μ = ${formattedMean}, σ = ${formattedSd}`);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "bottom")
    .style("font-size", "12px")
    .text(currVar.name);

  svg
    .append("text")
    .attr("x", marginLeft)
    .attr("y", marginTop + 10)
    .attr("text-anchor", "start")
    .attr("dominant-baseline", "top")
    .style("font-size", "12px")
    .text(`min = ${formattedMin}`);

  svg
    .append("text")
    .attr("x", width - marginRight)
    .attr("y", marginTop + 10)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "top")
    .style("font-size", "12px")
    .text(`max = ${formattedMax}`);

  // Add the x-axis.
  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x));

  // Add the y-axis.
  svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y));

  const bars = svg
    .selectAll("myRect")
    .data(stats.freqs)
    .enter()
    .append("g")
    .attr("class", "bar");

  bars
    .append("rect")
    .attr("x", (d: any) => x(d.min) ?? 0)
    .attr("y", (d: any) => y(d.count) ?? 0)
    .attr("width", (d: any) => x(d.max) - x(d.min))
    .attr("height", (d: any) => y(0) - y(d.count));

  /*
bars
    .append("text")
    .text(function (d) {
    return d.count;
    })
    .attr("x", function (d) {
    return x(d.bin) + binWidth / 2 + 5;
    })
    .attr("y", function (d) {
    return y(d.count) - 5;
    })
    .style("text-anchor", "middle")
    .style("font-size", "10px");
*/
  return svg;
};

const placeholderViewer = (message: string) => {
  const { width, height } = getDimensions();

  const svg = d3.create("svg").attr("width", width).attr("height", height);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text(message);

  return svg;
};

const variableViewer = (currVar: any) => {
  const stype = currVar.stats.stype;
  if (
    stype === "categorical" ||
    stype === "ordinal" ||
    stype === "multiselect"
  ) {
    return codedViewer(currVar);
  }
  if (stype === "real" || stype === "integer") {
    return numericViewer(currVar);
  }

  if (stype === "text") {
    return placeholderViewer(`Text variable ${currVar.name}`);
  }

  return placeholderViewer(`Unknown variable type ${stype}`);
};

const setViewer = (
  currVar: any = undefined,
  displayState: "missingness" | "values" = "values"
) => {
  if (currVar === undefined) {
    const message =
      displayState === "missingness"
        ? "Select a variable to view its missingness distribution"
        : "Select a numeric or coded variable to view its distribution.";
    setViewerElement(placeholderViewer(message));
  } else {
    const render =
      displayState === "missingness"
        ? missingnessViewer(currVar)
        : variableViewer(currVar);

    setViewerElement(render);
  }
};

// Viewer Methods

const viewer = getElementOrThrow("viewer");

const getDimensions = (): ViewerDimensions => {
  return {
    width: viewer.offsetWidth,
    height: viewer.offsetHeight * 0.95,
    marginTop: 20,
    marginRight: 20,
    marginBottom: 45,
    marginLeft: 40,
  };
};

const setViewerElement = <
  GElement extends Element,
  Datum,
  PElement extends d3.BaseType,
  PDatum,
>(
  element: d3.Selection<GElement, Datum, PElement, PDatum>
) => {
  const node = element.node();
  if (node === null) {
    throw new Error("Element is missing node");
  }

  if (viewer.firstChild !== null) {
    viewer.removeChild(viewer.firstChild);
  }
  viewer.append(node);
};

export { setViewer };
