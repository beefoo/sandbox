
import csv
import json
import os
import re

def readJSON(filename):
    data = {}
    if os.path.isfile(filename):
        with open(filename, encoding="utf8") as f:
            data = json.load(f)
    return data

def writeCsv(filename, arr, headings):
    with open(filename, "w", encoding="utf8", newline='') as f:

        writer = csv.writer(f)
        writer.writerow(headings)

        for i, d in enumerate(arr):
            row = []
            for h in headings:
                value = ""
                if h in d:
                    value = d[h]
                    if isinstance(value, str):
                        value = re.sub('\s+', ' ', value).strip() # clean whitespaces
                row.append(value)
            writer.writerow(row)

        print("Wrote %s rows to %s" % (len(arr), filename))

# Source: https://www.usatoday.com/in-depth/graphics/2020/06/03/map-protests-wake-george-floyds-death/5310149002/
jsonData = readJSON("floyd/2020-protest-locations-albers_geo.json")
locations = jsonData["features"]
columns = ["City", "State", "Date_started", "Date_ended", "Size", "Lat", "Long", "Local_coverage_link", "Notes"]

rows = []
for loc in locations:
    row = {}
    props = loc["properties"]
    for col in columns:
        row[col] = props[col]
    rows.append(row)

writeCsv("floyd/floyd_protests_2020-06-08.csv", rows, columns)
