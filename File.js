var File = function(fullPath) {
    this.FullName = fullPath;

    let parts = fullPath.split('\\').reverse();
    this.Parent = parts[1];
    this.Name = parts[0];
    this.IsImage = /(\.jpg)$/.test(parts[0]);
    return this;
};

File.InitBatch = function (arr, dir) {
    if (arr != null) {
        return arr.map(x => new File(dir + '\\' + x));
    }
    return [];
};

module.exports = File;