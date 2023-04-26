const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

async function copyDirectoryRecursiveSync(source, target) {
    // Check if target directory exists, and create it if it doesn't
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
    }

    // Get all files and directories in the source directory
    const files = fs.readdirSync(source);

    // Loop through each file/directory and copy it to the target directory
    files.forEach(file => {
        const sourcePath = path.join(source, file);
        const targetPath = path.join(target, file);
        const stats = fs.statSync(sourcePath);


        if (stats.isFile()) {
            // If it's a file, copy it to the target directory
            fs.copyFileSync(sourcePath, targetPath);
        } else if (stats.isDirectory()) {
            // If it's a directory, create a new directory in the target directory and copy its contents recursively
            const path = require("path");

            const directoryName = path.basename(targetPath);
            const root = path.join(targetPath, "..");
            console.log(path.basename(root));


            if (directoryName === "ci" || (directoryName === "vendor" && root != path.basename(root))) {

                console.log("Skipping ci");
            } else {
                if (!fs.existsSync(targetPath)) {
                    fs.mkdirSync(targetPath);
                }
                // fs.mkdirSync(targetPath);
                copyDirectoryRecursiveSync(sourcePath, targetPath);
            }

        }
    });
}



function extractZip(zipPath, destPath) {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(destPath, true);
}

function saveZipPath(zipPath, container) {
    // save to a json file container
    const stagesJsonPath = path.join(process.cwd(), 'stages-log.json');
    if (!fs.existsSync(stagesJsonPath)) {
        fs.writeFileSync(stagesJsonPath, JSON.stringify({}));
    }
    const stages = JSON.parse(fs.readFileSync(stagesJsonPath));
    if (!stages[container]) {
        stages[container] = []; // create an empty array if the container key does not exist
    }
    stages[container].push(zipPath); // add the zipPath to the array for the specified container
    fs.writeFileSync(stagesJsonPath, JSON.stringify(stages));
}

function getLastAddedPath(container) {
    const stagesJsonPath = path.join(process.cwd(), 'stages-log.json');
    if (!fs.existsSync(stagesJsonPath)) {
        return null;
    }
    const stages = JSON.parse(fs.readFileSync(stagesJsonPath));
    if (!stages[container] || stages[container].length === 0) {
        return null;
    }
    const lastPathIndex = stages[container].length - 1;
    return stages[container][lastPathIndex];
}


function setupStaging(containerPath) {
    //copy all from main to this
    // copyDirectoryRecursiveSync(, '/path/to/target');
}

async function startStage(containerPath) {
    console.log("Starting stage");
    console.log(containerPath);
    return new Promise((resolve, reject) => {
        const server = spawn(`php`, ['artisan', 'serve', '--port=7073'], { cwd: containerPath, shell: true });
        var output = "";

        server.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            resolve(`stdout: ${data}`);
        });

        server.stderr.on('data', (data) => {
            output = output + "\n" + data;
            console.error(`stderr: ${data}`);
        });


        server.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            resolve(output);
        });

    });

}

function runComposerInstallT(folderPath) {
    const composerInstall = spawn('composer', ['install'], { shell: true, cwd: folderPath });

    composerInstall.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    composerInstall.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    composerInstall.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

    composerInstall.on('error', (error) => {
        console.log(`Error: ${error.message}`);
    });
}

async function runComposerInstall(folderPath, res, req) {
    const composerInstall = spawn('composer', ['install'], { shell: true, cwd: folderPath });

    composerInstall.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    composerInstall.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        res.write(data);
    });

    composerInstall.on('close', (code) => {
        res.write("Done");
        console.log(`child process exited with code ${code}`);
    });

    composerInstall.on('error', (error) => {
        console.log(`Error: ${error.message}`);
        res.send("Error: ${error.message}");
    });
}

function runComposerInstall2(folderPath, res) {
    return new Promise((resolve, reject) => {
        const composerInstall = spawn('composer', ['install'], { shell: true, cwd: folderPath });

        composerInstall.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            // res.write(data);
        });

        composerInstall.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            // res.write(data);
        });

        composerInstall.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            if (code === 0) {
                resolve("Done");
            } else {
                resolve("Error");
            }
        });

        composerInstall.on('error', (error) => {
            console.log(`Error: ${error.message}`);
            resolve(error.message);
        });
    });

}


function saveMessageToJson(message, userId) {
    console.log(JSON.stringify(message));
    const msgs = JSON.parse(JSON.stringify(message));
    const changesJsonPath = path.join(process.cwd(), '..', 'public', 'changes-ci-db-log.json');

    let messages;
    try {
        const data = fs.readFileSync(changesJsonPath, 'utf8');
        messages = JSON.parse(data);
    } catch (err) {
        messages = [];
    }

    let nonExisting = []
    msgs.forEach((msg) => {
        const messageObj = {
            message: msg,
            readers: []
        };

        const existingMessage = messages.find((m) => m.message.trim() === msg.trim());
        if (existingMessage) {
        } else {
            nonExisting.push(messageObj);
        }


    });


    console.log("nonExisting", nonExisting);

    nonExisting.forEach(element => {
        messages.push(element);
    });
    // const messageObj = {
    //     message,
    //     readers: []
    // };

    // const existingMessage = messages.find((msg) => msg.message === message);
    // if (existingMessage) {
    //     existingMessage.readers.push(userId);
    // } else {
    //     messages.push(messageObj);
    // }

    // messages.push(messageObj);
    fs.writeFileSync(changesJsonPath, JSON.stringify(messages));
}



module.exports = { extractZip, setupStaging, copyDirectoryRecursiveSync, startStage, runComposerInstall, runComposerInstall2, saveZipPath, getLastAddedPath, saveMessageToJson };