# Global Industrialization Paths

![Screenshot of the world's countries from 1991 visualized across two economic indicators.](https://hosting.photobucket.com/bbcfb0d4-be20-44a0-94dc-65bff8947cf2/1dbd2cb2-9a27-4c2a-9d12-c77b51a3e20e.png)

Transforms a country-level CSV dataset into a structured JSON time series and renders it as an animated, interactive D3 bubble chart showing how countries move over time across two economic indicators.

## Overview

Takes a country-level economic CSV file and turns it into a clean time series to drive a D3 bubble chart. A Python step first reshapes the data into a normalized, compact JSON structure. Each country becomes a bubble whose horizontal position, vertical position and size represent three economic measures.

On the frontend, a responsive D3 visualization animates these bubbles through time with smooth transitions, tooltips and playback controls. Users can advance year-by-year, autoplay the timeline or pause to inspect individual countries in detail. The result is a clear view of how countries evolve over time across multiple economic dimensions.

## Set Up Instructions

Below are the required software programs and instructions for installing and using this application.

### Programs Needed

- [Git](https://git-scm.com/downloads)

- [Python](https://www.python.org/downloads/)

### Steps

1. Install the above programs

2. Open a terminal

3. Clone this repository using `git` by running the following command: `git clone git@github.com:devbret/global-industrialization-paths.git`

4. Navigate to the repo's directory by running: `cd global-industrialization-paths`

5. Create a virtual environment with this command: `python3 -m venv venv`

6. Activate your virtual environment using: `source venv/bin/activate`

7. Download the [source data](https://www.fao.org/faostat/en/#data/MK) as a CSV file

8. Place the `Macro-Statistics_Key_Indicators_E_All_Data.csv` file into the root directory of this repo and rename it `data.csv`

9. Process the raw data using the Python script by running the following command: `python3 app.py`

10. Launch the application's frontend by starting a Python server with the following command: `python3 -m http.server`

11. Access the heatmap visualization in a browser by visiting: `http://localhost:8000`

12. Explore and enjoy

## Other Considerations

This project repo is intended to demonstrate an ability to do the following:

- Transform economic CSV data into a structured JSON format

- Animate economic indicators over time for exploratory data analysis

If you have any questions or would like to collaborate, please reach out either on GitHub or via [my website](https://bretbernhoft.com/).
