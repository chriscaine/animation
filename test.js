const FlashAir = require('./FlashAir');

var flashAir = new FlashAir();

flashAir.input$.subscribe(function (newImage) {
    console.log('new immage');
    console.log(newImage);
});