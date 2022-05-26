# -*- coding: utf-8 -*-

import csv
import glob
import os

def readCsv(filename, encoding="utf8"):
    rows = []
    fieldnames = []
    if os.path.isfile(filename):
        lines = []
        with open(filename, 'r', encoding=encoding, errors="replace") as f:
            lines = list(f)

        reader = csv.DictReader(lines, skipinitialspace=True)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)
        print("  Read %s rows from %s" % (len(rows), filename))
    return (fieldnames, rows)

def writeCsv(filename, arr, headings, encoding="utf8"):
    with open(filename, 'w', encoding=encoding, newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headings)
        for i, d in enumerate(arr):
            row = []
            for h in headings:
                value = ""
                if h in d:
                    value = d[h]
                row.append(value)
            writer.writerow(row)
    print("Wrote %s rows to %s" % (len(arr), filename))


imagePath = "/Users/brianfoo/Dropbox/culture_paste/02_cropped/*"
imageFilenames = [os.path.basename(fn) for fn in glob.glob(imagePath)]
fieldnames, rows = readCsv("data.csv")

for i, row in enumerate(rows):
    url = row["URL"]
    source = row["Source"]
    parts = url.split('/')
    id = parts[-1]
    if ':' in id:
        id = id.split(':')[-1]
    if id.startswith('details-'):
        id = id[len('details-'):]
    filenameStart = source + '.' + id
    foundFilename = None
    for j, fn in enumerate(imageFilenames):
        if fn.startswith(filenameStart):
            foundFilename = fn
            break
    if foundFilename is None:
        print('Could not find id: %s' % filenameStart)
        continue
    rows[i]["Id"] = id
    rows[i]["Filename"] = foundFilename

writeCsv('updated_data.csv', rows, fieldnames)
