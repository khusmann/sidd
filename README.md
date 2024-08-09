# sidd: A Standalone Interactive Data Dictionary

sidd is a little utility for generating interactive data dictionaries for
[frictionless data packages](https://datapackage.org/).

Given a frictionless data package, sidd will render a single, self-contained
HTML file that allows users to explore all of the fields and resources in the
data package. The interactive interface enables you to search for fields and
quickly view visualizations of summary statistics (e.g. histograms) of the
available data.

For an example of the sort of report that is generated, follow
[this link](https://github.com/khusmann/sidd/releases/download/v0.2.1/codebook.html)
to download an example report. Note that the example report may take a moment to
load, as it generates a synthetic (nonsense) data set on the fly.

Below is a screenshot of a typical run with generated synthetic data:

![screenshot of typical run](https://github.com/user-attachments/assets/c54f3c1f-49dc-4d7b-8d25-bc53a5d88914)

## Installation

To setup sidd, clone the repo and run:

```
yarn install
```

Then install the cli globally by running:

```
yarn global add <FULL_PATH_TO_PROJECT_DIR>
```

## Usage

Once sidd is available globally, point it to a frictionless datapackage.json
file:

```
sidd /path/to/datapackage.json -o codebook.html
```

This will generate a file called `codebook.html` in the current directory, with
all of the information about the data package.

## Why sidd?

sidd was created to demonstrate the power of machine-readable metadata for
preparing data for sharing and exchange. When research data are shared,
researchers must include a
[data dictionary](https://www.nnlm.gov/guides/data-glossary/data-dictionary)
(sometimes called a "codebook") with their data to describe all of the variables
in the dataset. The data dictionary critical for understanding and using the
data, because it provides information about the variables in the dataset,
including their names, descriptions, and codings (e.g. 1 = NO, 2 = YES). Without
a data dictionary, it can be difficult to understand the data and use it
effectively.

Traditionally, data dictionaries are created by hand, which can be incredibly
time consuming and difficult to maintain as the data get updated or modified.
sidd is a proof of concept that demonstrats how the process of creating data
dictionaries can be completely automated when the metadata from a study is
documented in a machine-readable format. Here, I use the
[Frictionless Data Package standard](https://frictionlessdata.io/specs/data-package/)
but it could easily be adapted to work with other metadata standards such as
[CDISC](https://www.cdisc.org/) or [DDI](https://ddialliance.org/).

sidd exists to show how **machine readable metadata can make your life easier**.
Right now, researchers have little motivation to generate machine-readable
metadata for their projects, because generally advertised as a way to make data
more Findable, Accessible, Interoperable, and Reusable (FAIR). But these
altruistic motivations only go so far... If we want researchers to generate
metadata in machine-readable formats, we need to show how these formats can
directly benefit the researchers themselves. sidd demonstrates how
machine-readable metadata data can provide direct value to researchers by
generating documentation for their data.

In other words, if we're serious about making data FAIR, we need to invest in
the tooling and infrastructure that makes it easy for researchers to generate
and use machine-readable metadata in ways that provide direct benefit to them.
sidd is a small step in that direction.

## Why standalone?

sidd was designed to generate standalone, static HTML files that can be easily
shared by researchers. There's no need to host any kind of webapp or install any
kind of viewer... you just pull up the html file in any major web browser and
you're good to go. This makes it easier to share data dictionaries with
collaborators, reviewers, or the public.

## Current Features

- Toggle between resources in the datapackage
- Search for fields by name, description, type, etc.
- Different visualizations for values different field types (e.g. histograms for
  numeric fields, bar charts for categorical fields)
- Easy toggle visualization between values and missing reasons (press shift, or
  click the link above the visualization pane)

## Next steps

sidd is a work in progress -- the result of a couple weekend hackathons. It was
meant to be a simple proof of concept to see if this general idea was feasible.

Possible directions for future work:

1. An R package that allows you to generate sidd reports from within R, without
   needing to build it via yarn.

2. A more polished web interface that allows you to "slice and dice" the data by
   putting together different filters.

3. Options to generate more traditional CSV data dictionaries or PDF codebooks
   in addition to the interactive ones.
