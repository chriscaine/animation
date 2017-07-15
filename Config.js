"use strict";

const fs = require('fs');
var Config = null;
try {
    var Config = JSON.parse(fs.readFileSync('data/config.json'));
} catch (e) {
    throw Error("Failed to load config");
}

module.exports = Config;