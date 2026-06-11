# Animated Global Industrialization Paths

![Screenshot of the world's countries from 1991 visualized across two economic indicators.](https://hosting.photobucket.com/bbcfb0d4-be20-44a0-94dc-65bff8947cf2/1dbd2cb2-9a27-4c2a-9d12-c77b51a3e20e.png)

Transform country-level CSV data into a structured JSON time series and render it as an animated, interactive D3 bubble chart showing how countries move over time across three economic indicators.

## Application Overview

A Python processing script first reads the source CSV, extracts selected indicators, reshapes year-based columns into a clean time series and exports a compact `bubble_data.json` file for the frontend. Each country is represented as a bubble, with its position and size mapping to GDP per capita, manufacturing value added as a share of GDP and total GDP.

The frontend then uses D3 to render a responsive animated bubble chart which moves countries through time. Users can play the timeline automatically, pause it and hover over individual countries to inspect their values. Together, the data pipeline and browser visualization make it easier to compare how countries develop, industrialize and shift across multiple economic dimensions over time.

## Basic Setup Instructions

Below are the required software programs and instructions for installing and using this application on a Linux machine.

### Programs Needed

- [Git](https://git-scm.com/downloads)

- [Python](https://www.python.org/downloads/)

### Steps For Use

1. Install the above programs

2. Open a terminal

3. Clone this repository: `git clone git@github.com:devbret/global-industrialization-paths.git`

4. Navigate to the repo's directory: `cd global-industrialization-paths`

5. Create a virtual environment: `python3 -m venv venv`

6. Activate your virtual environment: `source venv/bin/activate`

7. Install the needed dependencies: `pip install -r requirements.txt`

8. Download the [source data](https://www.fao.org/faostat/en/#data/MK) as a CSV file

9. Place `Macro-Statistics_Key_Indicators_E_All_Data.csv` in the root directory of this project

10. Rename the newly added `.csv` file to `data.csv`

11. Process the raw data: `python3 app.py`

12. Launch an HTTP server: `python3 -m http.server`

13. Access the frontend in a browser: `http://localhost:8000`

14. When finished, close the HTTP server: `CTRL + C`

15. Exit the virtual environment: `deactivate`

## Other Considerations

This project repo is intended to demonstrate an ability to do the following:

- Process global economic CSV data into a JSON format for a D3 bubble chart visualization

- Provide an animated timeline for exploring industrialization and economic development across countries

- Turn source data into a frontend to let users play, pause and inspect country-level metrics

If you have any questions or would like to collaborate, please reach out either on GitHub or via [my website](https://bretbernhoft.com/).
