"use strict";

const fs = require('fs');


fs.writeFileSync('data/config.json', JSON.stringify({ media : '', images : '' }));