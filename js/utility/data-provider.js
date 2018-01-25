define(['../utility/read-file.js'], function(ReadFile) {

    function DataProvider() {

    }
    DataProvider.prototype.sourceFile = null;
    DataProvider.prototype.sourceData = null;

    DataProvider.prototype.fetchData = function() {
        if(this.sourceData) {
            return new Promise((resolve) => {
                resolve(this.sourceData);
            });
            } else if(this.sourceFile) {
            return ReadFile.readFileAsJson(this.sourceFile);
        }
    }

    return DataProvider;
});
