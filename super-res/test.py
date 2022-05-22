# -*- coding: utf-8 -*-

# Based on https://github.com/idealo/image-super-resolution/blob/master/notebooks/ISR_Prediction_Tutorial.ipynb

import numpy as np
from PIL import Image

filename = '156422.jpg'
img = Image.open(filename)

from ISR.models import RDN, RRDN

# model = RDN(weights='noise-cancel')
model = RRDN(weights='gans')
# model = RDN(weights='psnr-small')
# model = RDN(weights='psnr-large')

sr_img = model.predict(np.array(img))
newImg = Image.fromarray(sr_img)
newImg.save('output.png')
print('Done.')
