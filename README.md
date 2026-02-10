# Global Industrialization Paths

![Screenshot of the world's countries from 1991 visualized across two economic indicators.](https://hosting.photobucket.com/bbcfb0d4-be20-44a0-94dc-65bff8947cf2/1dbd2cb2-9a27-4c2a-9d12-c77b51a3e20e.png)

Transforms a country-level CSV dataset into a structured JSON time series and renders it as an animated, interactive D3 bubble chart showing how countries move over time across two economic indicators.

## Overview

Takes a country-level economic CSV file and turns it into a clean time series to drive a D3 bubble chart. A Python step first reshapes the data into a normalized, compact JSON structure. Each country becomes a bubble whose horizontal position, vertical position and size represent three economic measures.

On the frontend, a responsive D3 visualization animates these bubbles through time with smooth transitions, tooltips and playback controls. Users can advance year-by-year, autoplay the timeline or pause to inspect individual countries in detail. The result is a clear view of how countries evolve over time across multiple economic dimensions.

## Data Source

Here is [a link to the FAOSTAT data](https://www.fao.org/faostat/en/#data/MK) this application relies on.
