const archiver = require('archiver');
const fs = require('fs');
const { createZipArchive, createZipArchivePres, zipDirectory } = require('../utils');
const { default: axios } = require('axios');
const FormData = require('form-data');
const { HOST, CI_PORT } = require('../utils/global');
const path = require('path');


async function zipAndSendFolder(folderPath, url) {
    if (folderPath == undefined || folderPath == null) {
        throw new Error("Please provide a valid folder path");
    }

    if (url == undefined || url == null) {
        throw new Error("Please provide a valid url");
    }

    // await createZipArchive(folderPath, `${folderPath}.zip`);

    await zipDirectory(`${process.cwd()}`, `${folderPath}.zip`)

    const form = new FormData();
    form.append('file', fs.createReadStream(`${folderPath}.zip`));
    form.append('message', 'This is a message');

    console.log(`${folderPath}.zip`)

    axios.post(url, form, {
        headers: {
            ...form.getHeaders()
        }
    }).then((response) => {
        // // The response object is a stream that we can listen to for updates
        // response.data.on('data', chunk => {
        //     console.log(chunk.toString());
        // });

        // // The 'end' event is emitted when the response is finished
        // response.data.on('end', () => {
        //     console.log('Response finished.');
        // });
        console.log(response.data);
    }).catch(error => {
        console.error(error.message);
    });

}

// Usage example
const folderPath = path.join(process.cwd(), 'stages', 'container');
const url = `${HOST}:${CI_PORT}/scripts/stage`;
zipAndSendFolder(folderPath, url).then(() => { console.log("Done") }).catch((err) => { console.log(err.message) });
