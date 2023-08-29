

import csv

infile = "E:/Dropbox/citizen_dj/downloads/citizen_dj_tony_schwartz_request_with_content_ids.csv"
outfile = "schwartz/data/citizen_dj_tony_schwartz_request_with_content_ids.csv"

newRows = []
with open(infile, 'r', encoding="utf8") as f:
    reader = csv.reader(f)
    for row in reader:
        subrow = row[1:4]
        newRows.append(subrow)

with open(outfile, "w", encoding="utf8", newline='') as f:
    writer = csv.writer(f)
    writer.writerows(newRows)

print("Done.")
