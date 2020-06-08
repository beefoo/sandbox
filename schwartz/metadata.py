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
parser.add_argument('-in', dest="METADATA_FILE", default="schwartz/data/citizen_dj_tony_schwartz_with_metadata.csv", help="Input file with metadata")
parser.add_argument('-map', dest="MAP_FILE", default="schwartz/data/citizen_dj_tony_schwartz_request_with_content_ids.csv", help="Input file for mapping content ids")
parser.add_argument('-dir', dest="MEDIA_DIR", default="D:/citizen_dj/downloads/schwartz/*.wav", help="Folder with media")
parser.add_argument('-out', dest="OUTPUT_FILE", default="schwartz/output/loc-tony-schwartz.csv", help="Output file")
parser.add_argument('-probe', dest="PROBE", action="store_true", help="Just output details?")
a = parser.parse_args()

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

_, items = readCsv(a.METADATA_FILE)
_, mappedItems = readCsv(a.MAP_FILE)
mediaFilenames = glob.glob(a.MEDIA_DIR)

itemLookup = createLookup(items, "id")

files = []
for i, fn in enumerate(mediaFilenames):
    basename = os.path.basename(fn)
    id = basename.split(".")[0]
    files.append({
        "filename": basename,
        "id": id,
        "path": fn
    })
fileLookup = createLookup(files, "id")

validItems = []
for itemMap in mappedItems:
    id = itemMap["ContentID"]
    mavisId = itemMap["MAVIS"].split("-")[0]

    if id == "":
        continue

    if mavisId not in itemLookup:
        print("Could not find MAVIS id: %s" % mavisId)
        continue

    if id not in fileLookup:
        print("Could not find file: %s" % id)
        continue

    file = fileLookup[id]
    metadata = itemLookup[mavisId]

    item = {}
    item["id"] = id
    item["filename"] = file["filename"]
    item["title"] = metadata["title"]
    item["date"] = metadata["date"]
    item["contributors"] = metadata["contributors"]
    item["summary"] = metadata["summary"]
    validItems.append(item)

print("%s valid items found." % len(validItems))

if a.PROBE:
    sys.exit()

fieldsOut = ["id", "filename", "date", "title", "contributors", "summary"]
writeCsv(a.OUTPUT_FILE, validItems, fieldsOut)
