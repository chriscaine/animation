const FlashAir = require('./FlashAir');

var flashAir = new FlashAir();

flashAir.status$.subscribe(x => console.log('status', x, new Date()));

flashAir.input$.subscribe(function (newImage) {
    console.log('new immage');
    console.log(newImage);
});