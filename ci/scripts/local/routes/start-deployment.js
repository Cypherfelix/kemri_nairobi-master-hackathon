var arguments = process.argv;
const axios = require('axios').default;
const { HOST, CI_PORT } = require("../utils/global");
const url = `${HOST}:${CI_PORT}/scripts/start`;

function getAllFiles() {
    const fs = require('fs');
    const path = require('path');
    const directoryPath = path.join(__dirname, 'files');
    const files = fs.readdirSync(directoryPath);
    return files;
}

var fs = require('fs');

function readFiles(dirname, onFileContent, onError) {
    fs.readdir(dirname, function (err, filenames) {
        if (err) {
            onError(err);
            return;
        }
        filenames.forEach(function (filename) {
            fs.readFile(dirname + filename, 'utf-8', function (err, content) {
                if (err) {
                    onError(err);
                    return;
                }
                onFileContent(filename, content);
            });
        });
    });
}
if (arguments[2] == undefined || arguments[2] == null) {
    console.log("Please provide a message for the deployment");
    return;
}

axios.post(url, {
    message: arguments[2],
}).then((res) => { console.log(res.data) }).catch((err) => { console.log(err.message) });

