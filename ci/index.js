const express = require('express');
const router = require('./scripts/server/routes/index.js');
const { copyDirectoryRecursiveSync, startStage, runComposerInstall } = require('./scripts/server/utils/index.js');
const app = express()
const port = process.env.CI_PORT | 7000;
const path = require('path');
console.log(path.join(process.cwd(), '..'))

app.use(express.json());

app.use("/scripts", router);


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

// const from = path.join(process.cwd(), '..');
const to = path.join(process.cwd(), 'staging', 'default');
// console.log(to);
// runComposerInstall(to);

// const { spawn } = require('child_process');
// const { platform } = require('process');

// console.log(platform);

// // const command = platform === 'win32' ? 'cd' : 'pwd';
// // const args = platform === 'win32' ? ['/d', '&', 'echo', '%CD%'] : [];
// const command = `php`
// const args = ['artisan', 'serve', '--port=7072']

// const child = spawn(command, args, { shell: true, cwd: to });

// child.stdout.on('data', (data) => {
//     console.log(`Current working directory: ${data}`);
// });

// child.stderr.on('data', (data) => {
//     console.error(`Error: ${data}`);
// });

// child.on('close', (code) => {
//     console.log(`Child process exited with code ${code}`);
// });

// child.on('error', (error) => {
//     console.log(`Error: ${error.message}`);
// });

// 