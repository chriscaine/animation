const Datastore = require('nedb');
const fs = require('fs');
const Observable = require('rxjs/Rx').Observable;
const Subject = require('rxjs/Rx').Subject;
const Helpers = require('./build/js/services/helpers.js');
function onDbLoad(err) {
}

const Socket = {
    ProjectUpdate: 'project:update',  //outgoing
    ProjectList: 'project:list',  // outgoing
    ProjectSelect: 'project:selected', //
    ImageList: 'image:list',
    MediaList: 'media:list',
    Render: 'render:start',
    NewImage: 'image:add',
    NewProject: 'project:add',
    LoadingProject: 'project:load', // outgoing - deprecated
    LoadProjects: 'project:load:list', // incoming
    CameraStatus: 'camera:status'
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


var db = {
    projects: new Datastore({ filename: 'data/projects.db', autoload: true, onload: onDbLoad }),
    images: new Datastore({ filename: 'data/images.db', autoload: true, onload: onDbLoad })
};


function loadProjects(query) {
    return Observable.create(function (observe) {
        db.projects.find({}, function (err, docs) {
            console.log('docs', docs);
            if (err) console.log('db read error: ', err);
            if (docs) observe.next(docs);
        });
    });
}

function loadProject(id, callback) {
    console.log('load', id);
    db.projects.findOne({ _id: id }, function (err, doc) {
        if (err) console.log('db read error: ', err);
        if (doc) {
             callback(doc);
        }
    });
}

function createProject(model, callback) {
    var p = Project.Create(model);
    console.log('create', p);
    db.projects.insert(p, function (err, newDoc) {
        if (err) {
            console.log('db write error', err);
        } else {
            console.log('new doc', newDoc);
            callback(newDoc);
        }
    });
}

function update(data, callback) {
    // db.project.update(data)
    console.log('Update db not implimented');
    db.projects.update({ _id: data._id }, { $set: { frames: data.frames } }, function (err, doc) {
        callback(doc);
    });    
}

const CREATE = 'create';
const OPEN = 'open';
const UPDATE = 'update';

var ProjectEngine = function () {
    var allow = true;

    this.filter = () => allow;
    this.manage = function (x) {
        return Observable.create(function (observe) {
            console.log('manage', x.data);
            switch (x.command) {
                case CREATE:
                    createProject(x.data, c => observe.next(c));
                    break;
                case OPEN:
                    console.log('open', x);
                    loadProject(x.data._id, c => observe.next(c));
                    break;
                case UPDATE:
                    update(x.data, c => observe.next(c));
            }
        });
    }
}


function saveImages(arr) {
    var imgObj = arr[0];
    var project = arr[1];
    var imgDir = 'data/images/{0}/';
    var thumbDir = 'public/images/{0}/';

    var fileName = Helpers.NumberToFileName(project.frames.length, 'IMG_', '.jpg');

    /**
     * Generate new file number from ?
     * Save both items to disk
     * return img file
     * */

    if (imgObj.thumbnail !== null) {
        fs.writeFile(Helpers.Format(thumbDir, [project._id, fileName]), imgObj.thumbnail);
    }
    if (imgObj.data !== null) {
        fs.writeFile(Helpers.Format(imgDir, [project._id, fileName]), imgObj.data);
    }

    project.frames.push(fileName);

    return project;
}

var App = function (io, socket, imageProvider) {


    var _status$ = imageProvider.status$;
    imageProvider.input$.subscribe(x => console.log('new image'));
    var current$ = new Subject();
    // sending polling info from image provider
    _status$.subscribe(status => { console.log(status); io.emit(Socket.CameraStatus, status); });

    // respond to request for project list (self contained)
    Observable.fromEvent(socket, Socket.LoadProjects).flatMap(loadProjects).subscribe(l => io.emit(Socket.ProjectList, l));

    // check what the incoming evt object is
    var create$ = Observable.fromEvent(socket, Socket.NewProject).map(x => ({ command: CREATE, data: x }));
    var load$ = Observable.fromEvent(socket, Socket.ProjectSelect).map(x => ({ command: OPEN, data: x }));

    var update$ = imageProvider.input$.withLatestFrom(current$).flatMap(saveImages).map(x => ({ command: UPDATE, data: x }));

    current$.subscribe(x => console.log('c',x));

    var projectEngine = new ProjectEngine();

    var project$ = Observable.merge(create$, load$, update$).filter(projectEngine.filter).flatMap(projectEngine.manage).share();
    project$.subscribe(x => io.emit(Socket.ProjectUpdate, x));
    project$.subscribe(x => current$.next(x));
    /**
     * INPUTS
     *  
     * create project
     * load project
     * update project - title / fps / frames
     * export project
     * 
     * OUTPUTS
     * 
     * project list
     * project load / update
     * 
     * camera connection status
    */





}


module.exports = App;