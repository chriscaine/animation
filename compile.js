var sass = require('sass');
var concat = require('concat');
var watch = require('watch');
var fs = require('fs');

function js() {
    var folders = ',/directives,/services,/controllers,/models'.split(',');
    var fileSets = folders.map(x => fs.readdirSync('build/js' + x).map(d => 'build/js' + x + '/' + d));//.flat();
    var files = [];
    fileSets.forEach((item, index, arr) => files = files.concat(item));
    files = files.filter(x => /\.js$/.test(x)).map(x => x);
    concat(files, 'public/js/app.js');
}


function css() {
    sass.render({
        file: 'build/scss/bootstrap.scss'
    }, function (err, result) {
        if (!err) {
            fs.writeFileSync('public/css/site.css', result.css);
        }
    });
}


watch.watchTree('build/js/', js);

watch.watchTree('build/scss/', css);