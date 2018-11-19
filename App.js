const Datastore = require('nedb');
const Observable = require('rxjs/Rx').Observable;
const Subject = require('rxjs/Rx').Subject;
const Helpers = require('./build/js/services/helpers.js');
function onDbLoad(err) {
    console.log('load', err);
}

const Socket = {
    ProjectList: 'project:list',
    ProjectSelect: 'project:selected',
    ImageList: 'image:list',
    MediaList: 'media:list',
    Render: 'render:start',
    NewImage: 'image:add',
    NewProject: 'project:add',
    LoadingProject: 'project:load',
    LoadProjects: 'project:load:list'
}


var Project = function () {
    return this;
}
Project.Create = function (obj) {
    var p = new Project();
 //    p._id = Helpers.Guid.NewGuid();
    p.frames = [];
    for (var key in obj) {
        p[key] = obj[key];
    }
    return p;
}

var App = function (io, socket, input$) {
    var _input$ = input$;
   
    var db = {
        projects: new Datastore({ filename: 'data/projects.db', autoload: true, onload: onDbLoad }),
        images: new Datastore({ filename: 'data/images.db', autoload: true, onload: onDbLoad })
    };

    function loadProject(id) {
        console.log('load', id);
       db.projects.findOne(id, function (err, doc) {
           if (err) console.log('db read error: ', err);
           if (doc) {
               console.log('loading project', doc._id);
               io.emit(Socket.LoadingProject, doc);
           }
        });
    }

    function loadProjects(query) {
        console.log('load', 'query');
        db.projects.find(query ? query : {}, function (err, docs) {
            if (err) console.log('db read error: ', err);
            if (docs) io.emit(Socket.ProjectList, docs);
        });
    }

    var createProject$ = Observable.fromEvent(socket, Socket.NewProject);
    var loadProject$ = Observable.fromEvent(socket, Socket.ProjectSelect);
    var loadProjects$ = Observable.fromEvent(socket, Socket.LoadProjects);

    createProject$.subscribe(function (name) {
        var p = Project.Create(name);
        console.log('create', p);
       db.projects.insert(p, function (err, newDoc) {
            if (err) {
                console.log('db write error', err);
            } else {
                console.log('new doc', newDoc);
                io.emit(Socket.LoadingProject, newDoc);
            }
        });
    });

    loadProject$.map(loadProject).filter(x => x).subscribe(p => io.emit(Socket.LoadingProject, p));
    loadProjects$.map(loadProjects).subscribe(l => io.emit(Socket.ProjectList, l));

    _input$.subscribe(function (image) {
        console.log(image);
    });
}


module.exports = App;