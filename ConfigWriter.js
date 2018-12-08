"use strict";

const fs = require('fs');


fs.writeFileSync('data/config.json', JSON.stringify({ "MediaFolder": "", "ImagesFolder": "", "FlashAirHost": "http://caineair/", "DefaultImageFolder": "/DCIM/101EOS7D" }));