const express = require('express');
const multer = require('multer');
const path = require('path');
const AdmZip = require('adm-zip');
const fs = require('fs');
const { extractZip, copyDirectoryRecursiveSync, startStage, runComposerInstall, runComposerInstall2, saveZipPath, getLastAddedPath, saveMessageToJson } = require('../utils');

const router = express.Router();

// router.post('/stage', (req, res) => {

//     res.send('Staging');
// });

router.post('/deploy', (req, res) => {
    var { container, message, changesInfo } = req.body;
    console.log(req.body);
    if (container === undefined) {
        container = 'default';
    }
    const containerPath = path.join(process.cwd(), 'staging', container);
    if (!fs.existsSync(containerPath)) {
        res.status(404).json('Container does not exist');
    }
    if (message === undefined) {
        res.status(404).json('Message is required');
    }

    const zipPath = getLastAddedPath(container);
    if (zipPath === null || !fs.existsSync(zipPath)) {
        res.status(404).send('No staging zip file found');
    }



    const to = path.join(process.cwd(), '..');
    console.log(to);
    console.log(zipPath);
    extractZip(zipPath, to);

    saveMessageToJson(message);

    res.json('Deployed Sucesfully');

});

router.post('/reverse', (req, res) => {
    res.send('Reversing');
});

router.post('/info', (req, res) => {
    res.send('Info');
});

router.post('/start', (req, res, next) => {
    console.log(req);
    res.send('Test Successful: ');
});

router.post('/test-stage', async (req, res) => {
    const { container } = req.body;
    const containerPath = path.join(process.cwd(), 'staging', container);
    if (!fs.existsSync(containerPath)) {
        res.status(404).send('Container does not exist');
    }

    try {
        const data = await startStage(containerPath);
        // console.log(data);
        // res.write(data);
        res.write('Started test server on  \n');
        res.write(data);
        res.end();
    } catch (err) {
        res.status(500).send('Error starting server');
    }

});

router.post('/create-container', (req, res) => {
    const { container } = req.body;
    const containerPath = path.join(process.cwd(), 'staging', container);
    if (!fs.existsSync(containerPath)) {
        fs.mkdirSync(containerPath, { recursive: true });
    } else {
        res.send(`Container already exists use composer run-script ${container} to stage`);
    }
    res.send('Container created successfully');
});


// // Define a custom destination and filename function for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Generate a new directory path based on the current date
        const dateStr = new Date().toISOString().slice(0, 10);
        const dirPath = path.join(process.cwd(), 'staging', 'zips');
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        cb(null, dirPath);
    },
    filename: (req, file, cb) => {
        // Generate a new filename based on the original filename
        const ext = path.extname(file.originalname);
        const fileName = `${Date.now()}${ext}`;
        req.query.newname = path.join(process.cwd(), 'staging', 'zips', file.originalname);
        cb(null, file.originalname);
    },

});

// // Create a new multer upload object using the custom storage options
const upload = multer({ storage });

// Define a route to handle file uploads
router.post('/stage', async (req, res, next) => {
    var { container } = req.body;
    if (container === undefined) {
        const containerPath = path.join(process.cwd(), 'staging', `default`);
        if (!fs.existsSync(containerPath)) {
            fs.mkdirSync(containerPath, { recursive: true });
            const from = path.join(process.cwd(), '..');
            const to = path.join(process.cwd(), 'staging', 'default');
            await copyDirectoryRecursiveSync(from, to);
            const venFrom = path.join(process.cwd(), '..', 'public', 'vendor');
            const venTo = path.join(process.cwd(), 'staging', 'default', 'public', 'vendor');
            await copyDirectoryRecursiveSync(venFrom, venTo);

            console.log(venFrom);
            console.log(venTo);
            const t = await runComposerInstall2(to, res, req);
            // res.end('done');
            // res.write(t);
        }

        container = "default"
    } else {
        const containerPath = path.join(process.cwd(), 'staging', `${container}`);
        if (!fs.existsSync(containerPath)) {
            res.status(400).send(`Container ${container} does not exist`);
        }
    }

    const b = { ...req.body, container: container }
    req.query.container = container;
    next();
}, upload.single('file'), (req, res) => {
    console.log(req.body.message);
    const fileName = req.file.filename;
    // console.log(req.query.newname);
    console.log(`Received file: ${fileName}`);
    const from = req.query.newname;
    console.log(req.body);
    const to = path.join(process.cwd(), 'staging', req.query.container);
    console.log(from);
    console.log(to);
    extractZip(from, to);
    saveZipPath(from, req.query.container);

    res.send('File uploaded successfully');
});


// router.post('/stage', (req, res) => {
//     console.log("staging");
//     const zipFile = new AdmZip(req.body);
//     const zipEntries = zipFile.getEntries();
//     const extractDir = './extracted';

//     if (!fs.existsSync(extractDir)) {
//         fs.mkdirSync(extractDir);
//     }

//     zipEntries.forEach(zipEntry => {
//         const fileName = zipEntry.entryName;
//         const fileContent = zipEntry.getData();
//         const filePath = `${extractDir}/${fileName}`;

//         fs.writeFileSync(filePath, fileContent);
//     });

//     res.send('Zip file uploaded and extracted successfully!');
// });

module.exports = router;

