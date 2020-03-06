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
collectionTitle = ""
for row in rows:
    id, title = tuple(row[:2])
    id, title = (id.strip(), title.strip())

    isItem = len(id) > 0 and id.startswith("20")

    if not isItem and len(title) > 0:
        collectionTitle = title

    if not isItem:
        continue

    if "public domain" in title.lower():
        items.append({
            "id": id,
            "title": title,
            "performance": collectionTitle,
            "contributors": "",
            "date": "",
            "subjects": ""
        })

writeCsv(a.OUTPUT_FILE, items, ["id", "title", "performance", "contributors", "date", "subjects"])
