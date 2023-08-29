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
parser.add_argument('-in', dest="INPUT_FILE", default="data.csv", help="Input file")
parser.add_argument('-out', dest="OUTPUT_FILE", default="data_cleaned.csv", help="Output file")
a = parser.parse_args()

includeStrings = ["public domain"]
excludeStrings = [
    "research",
    "permission",
    "approval",
    "not a keeper",
    "corresponding audio",
    "public domain?",
    "corresponds w/ audio",
    "oral history",
    "interview",
    "corrrupt file",
    "bad file"
]

def readCsv(filename):
    rows = []
    with open(filename, "r", encoding="utf8", newline='') as f:
        reader = csv.reader(f)
        rows = [row for row in reader]
    return rows

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

rows = readCsv(a.INPUT_FILE)

items = []
eventTitle = ""
for row in rows:
    id, title = tuple(row[:2])
    id, title = (id.strip(), title.strip())

    isItem = len(id) > 0 and id.startswith("20")

    if not isItem and len(title) > 0:
        eventTitle = title

    if not isItem:
        continue

    titleLower = title.lower()
    eventLower = eventTitle.lower()
    valid = True
    for string in includeStrings:
        if string not in titleLower:
            valid = False
            break
    if not valid:
        continue

    for string in excludeStrings:
        for sstring in [eventLower, titleLower]:
            if string in sstring:
                valid = False
                break
        if not valid:
            break
    if not valid:
        continue

    items.append({
        "id": id,
        "originalRecordingTitle": title,
        "originalEventTitle": eventTitle,
        "contributors": "",
        "date": "",
        "subjects": ""
    })

writeCsv(a.OUTPUT_FILE, items, ["id", "originalRecordingTitle", "originalEventTitle", "contributors", "date", "subjects"])


# python3 update_meta.py -in "C:/Users/brian/apps/sandbox/musicbox/data_cleaned.csv" -key "id" -rkey "date" -find "([12][0-9]{3})([0-9]{2})([0-9]{2}).*" -repl "\1-\2-\3" -probe
