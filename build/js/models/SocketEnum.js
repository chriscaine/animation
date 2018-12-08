angular.module('app').value('Socket', {
    ProjectList: 'project:list',
    ProjectSelect: 'project:selected',
    ImageList: 'image:list',
    MediaList: 'media:list',
    Render: 'render:start',
    NewImage: 'image:add',
    NewProject: 'project:add',
    LoadingProject: 'project:load',
    LoadProjects: 'project:load:list',
    CameraStatus: 'camera:status',
    ProjectUpdate:'project:update'
});