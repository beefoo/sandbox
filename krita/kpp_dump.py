# -*- coding: utf-8 -*-

import argparse
from lxml import etree
from PIL import Image
from pprint import pprint

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="muses_02_04_Marker.kpp", help="Input file")
a = parser.parse_args()

png = Image.open(a.INPUT_FILE)
presetXml = etree.fromstring(png.text["preset"])
prettyXml = etree.tostring(presetXml, pretty_print=True, xml_declaration=True, encoding="UTF-8")
print(str(prettyXml))
with open(a.INPUT_FILE + ".xml", "w", encoding="utf8") as f:
    f.write(png.text["preset"])
