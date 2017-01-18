
importScripts("ffmpeg.js");

function load(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.onload = function (e) {
        if (this.status == 200) {
            callback(this.response);
        }
    };
    xhr.send();
}

function print(text) {
    postMessage({
        'type': 'stdout',
        'data': text
    });
}
var result;
onmessage = function (event) {
   
    switch (event.data.type) {
        case 'go':
           
            load('/test.mp4', function (blob) {
                var module = {
                    //  files: event.data.files || [],
                    arguments: ["test.mp4", "-c:v", "libvpx", "-an", "out.mp4"],
                    MEMFS: [{ name: "test.mp4", data: blob }],
                    print: print,
                    printErr: print,
                    exit: function () {
                        return result;
                    }
                };
                result = ffmpeg_run(module);


                postMessage({
                    'type': 'start',
                    'data': result
                });
            });
            break;
        case 'fetch': {
            postMessage({
                'type': 'data',
                'data': result
            });
        }


    }
    
    

};

postMessage({
    'type': 'ready'
});

