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
parser.add_argument('-in', dest="METADATA_FILE", default="musicbox/data_cleaned_and_edited.csv", help="Input file with metadata")
parser.add_argument('-dir', dest="MEDIA_DIR", default="D:/citizen_dj/downloads/musicbox/*", help="Folder with media")
parser.add_argument('-out', dest="OUTPUT_FILE", default="E:/Dropbox/citizen_dj/metadata/loc-musicbox.csv", help="Output file")
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
mediaFilenames = glob.glob(a.MEDIA_DIR)

files = []
for i, fn in enumerate(mediaFilenames):
    basename = os.path.basename(fn)
    id = basename.split(".")[0]
    if basename.endswith(".modd"):
        continue
    files.append({
        "filename": basename,
        "id": id,
        "path": fn
    })
fileLookup = createLookup(files, "id")

validItems = []
for f in files:

    found = []
    for item in items:
        if f["id"]+" " in item["originalRecordingTitle"]:
            found.append(item)

    if len(found) < 1 and f["id"].startswith("DR0"):
        id = f["id"].replace("DR0", "DR") + " "
        for item in items:
            if id in item["originalRecordingTitle"]:
                found.append(item)

    if len(found) < 1:
        print("Could not find ID: %s" % f["id"])
        continue

    if len(found) > 1:
        print("Too many found for ID: %s" % f["id"])
        continue

    foundItem = found[0]
    item = {
        "id": f["id"],
        "filename": f["filename"],
        "refId": foundItem["id"],
        "title": foundItem["cleanedRecordingTitle"],
        "contributors": foundItem["contributors"],
        "eventTitle": foundItem["cleanedEventTitle"]
    }
    validItems.append(item)

print("%s valid items found." % len(validItems))

if a.PROBE:
    sys.exit()

fieldsOut = ["id", "filename", "refId", "title", "contributors", "eventTitle"]
writeCsv(a.OUTPUT_FILE, validItems, fieldsOut)
