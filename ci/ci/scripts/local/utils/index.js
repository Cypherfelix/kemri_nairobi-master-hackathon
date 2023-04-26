const AdmZip = require("adm-zip");
const fs = require('fs');
const path = require("path");

async function createZipArchive(folder, outputFile) {
    try {
        const zip = new AdmZip();
        zip.addLocalFolder(folder);
        zip.writeZip(outputFile);
        console.log(`Created ${outputFile} successfully`);
        return true;
    } catch (e) {
        console.log(`Something went wrong. ${e}`);
        return false;
    }
}


async function createZipArchivePres(filePath, outputFolder, outputFile) {
    try {
        const zip = new AdmZip();
        const fileData = await fs.promises.readFile(filePath, 'utf8');
        const filePaths = fileData.split('\n').map(path => path.trim());

        filePaths.forEach(filePath => {
            const fileStats = fs.statSync(filePath);
            if (fileStats.isDirectory()) {
                zip.addLocalFolder(filePath, outputFolder + '/' + filePath, (zipPath) => {
                    return zipPath.substring(filePath.length + 1); // To remove leading directory name
                });
            } else {
                zip.addLocalFile(filePath, outputFolder);
            }
        });

        zip.writeZip(`${outputFolder}/${outputFile}`);
        console.log(`Created ${outputFile} successfully`);
        return true;
    } catch (e) {
        console.log(`Something went wrong. ${e}`);
        return false;
    }
}

function listFilesAndFolders(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    const files = entries.filter(entry => entry.isFile()).map(entry => entry.name);
    const folders = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
    const results = { files, folders };

    for (const folder of folders) {
        const folderPath = path.join(directory, folder);
        const folderResults = listFilesAndFolders(folderPath);
        results.files.push(...folderResults.files.map(file => path.join(folder, file)));
        results.folders.push(...folderResults.folders.map(subFolder => path.join(folder, subFolder)));
    }

    return results;
}

function changesContains(filePath) {
    const wd = process.cwd();
    const b = path.join(wd, filePath);
    const changes = require(path.join(wd, 'status.json'));
    const fileKeys = Object.keys(changes);
    for (let i = 0; i < fileKeys.length; i++) {
        const file = changes[fileKeys[i]].file;
        if (file === b) {
            console.log(file);
            console.log(b);
            return true;
        }

    }
    return false;
}

const root = path.join(process.cwd(), '..', '..');

function zipDirectory(directoryPath, zipFilePath) {
    const zip = new AdmZip();

    const addDirectory = (source, target) => {
        const entries = fs.readdirSync(source, { withFileTypes: true });

        for (const entry of entries) {
            const sourcePath = path.join(source, entry.name);
            const targetPath = path.join(target, entry.name);

            if (entry.isDirectory()) {
                addDirectory(sourcePath, targetPath);
            } else {
                const content = fs.readFileSync(sourcePath);
                if (changesContains(targetPath)) {
                    zip.addFile(targetPath, content);
                }
            }
        }
    };

    try {
        addDirectory(directoryPath, '');

        zip.writeZip(zipFilePath);
        console.log(`Created ${zipFilePath} successfully`);
    } catch (e) {
        console.log(e);
    }


}

// const p = path.join(process.cwd(), '..', '..');
// Example usage
// zipDirectory(p, 'test.zip');


// const p = listFilesAndFolders(root);
// console.log(p);

module.exports = { createZipArchive, createZipArchivePres, zipDirectory };