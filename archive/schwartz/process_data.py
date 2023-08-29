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
parser.add_argument('-ann', dest="ANN_FILE", default="output/cabinet-7037712_annotated.csv", help="Annotation file")
parser.add_argument('-probe', dest="PROBE", action="store_true", help="Just output command strings?")
a = parser.parse_args()

files = glob.glob(a.INPUT_FILE)
idPattern = re.compile(".*([0-9]{7}).*")

def createLookup(arr, key):
    return dict([(str(item[key]), item) for item in arr])

def readCsv(filename):
    rows = []
    fieldnames = []

    with open(filename, 'r', encoding="utf8") as f:
        lines = list(f)
        reader = csv.DictReader(lines, skipinitialspace=True)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)

    print("Read %s rows from %s" % (len(rows), filename))

    return (fieldnames, rows)

def hasValue(lines, text):
    found = False
    for line in lines:
        if text == line.strip():
            found = True
            break
    return found

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

existingRows = None
if len(a.ANN_FILE) > 0:
    existingFieldnames, existingRows = readCsv(a.ANN_FILE)

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

    # Check for digitized
    row["digitized"] = 1 if hasValue(lines, "Playable Audio and Video") or hasValue(lines, "Play") else 0

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

fieldnames = ["id", "date", "digitized", "dateType", "title", "contributors", "summary"]

if existingRows is not None:

    if len(rows) != len(existingRows):
        print("Warning: existing rowcount is %s, current rowcount is %s" % (len(existingRows), len(rows)))

    rowLookup = createLookup(existingRows, "id")

    for field in existingFieldnames:
        if field not in fieldnames:
            for i, row in enumerate(rows):
                rows[i][field] = rowLookup[row["id"]][field] if row["id"] in rowLookup else ""

    fieldnames = existingFieldnames

writeCsv(a.OUTPUT_FILE, rows, fieldnames)
