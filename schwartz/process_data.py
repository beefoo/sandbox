# -*- coding: utf-8 -*-

import argparse
import csv
import glob
import os
from pprint import pprint
import re
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="cabinet-7037712/titles/*", help="Input files")
parser.add_argument('-out', dest="OUTPUT_FILE", default="output/cabinet-7037712.csv", help="Output file")
parser.add_argument('-probe', dest="PROBE", action="store_true", help="Just output command strings?")
a = parser.parse_args()

files = glob.glob(a.INPUT_FILE)

idPattern = re.compile(".*([0-9]{7}).*")

def getValue(lines, text, multiline=False, delimeter=" ", endString=""):
    value = []
    foundStart = False
    for line in lines:
        if multiline:
            if foundStart and line != endString:
                if len(line) > 0:
                    value.append(line.strip())
            elif foundStart and len(value) > 0:
                break
        elif foundStart and line != endString:
            value = [line.strip()]
            break
        if line == text:
            foundStart = True
    value = delimeter.join(value).strip()
    return value

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

rows = []
for fn in files:
    basename = os.path.basename(fn)
    matches = idPattern.match(basename)

    if not matches:
        print("Could not find id pattern in %s" % basename)
        continue

    id = matches.group(1)
    row = {"id": id}

    lines = []
    with open(fn, "r", encoding="utf8", errors="replace") as f:
        lines = [line.strip() for line in f]

    # Find title
    title = getValue(lines, "Title %s" % id)
    if len(title) <= 0:
        title = getValue(lines, "Title Tree", multiline=True)
        if ":" in title:
            title = title.split(":", 1)[-1].strip()
    if len(title) <= 0:
        print("No title for %s" % basename)
    row["title"] = title

    # Find date
    date = getValue(lines, "Date")
    if date == "No dates found.":
        date = ""
    type = ""
    if "\t" in date:
        type, date = tuple(date.split("\t", 1))
    else:
        if not bool(re.search(r'\d', date)):
            type = date
            date = ""
    if date.startswith("false"):
        date = ""
    if type.startswith("false"):
        type = ""
    row["date"] = date
    row["dateType"] = type

    # Find contributors
    contributors = getValue(lines, "Name", multiline=True, delimeter=" | ")
    contributors = contributors.split(" | ")
    contributors = [c.split("\t", 1) for c in contributors]
    contributors = [c[1] + " (" +c[0]+ ")" if len(c) > 1 else c[0] for c in contributors]
    contributors = " | ".join(contributors)
    row["contributors"] = contributors

    # Find summary
    row["summary"] = getValue(lines, "Summary", multiline=True, endString="Credits/Roles")
    rows.append(row)

writeCsv(a.OUTPUT_FILE, rows, ["id", "date", "dateType", "title", "contributors", "summary"])
