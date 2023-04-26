const { default: axios } = require("axios");
const { HOST, CI_PORT } = require("../utils/global");
const { checkReleaseFileIsEmpty, recreateFile } = require("../utils");
const args = process.argv;


async function deploy(url, container, message, changes) {
    if (container == undefined || container == null) {
        console.log("Please provide a valid container");
        return;
    }
    var message = "";
    try {
        message = checkReleaseFileIsEmpty(message);
    } catch (error) {
        console.log(error.message);
    }

    axios.post(url, {
        message: message,
        container: container,
        changes: changes
    }).then((response) => {
        console.log(response.data);
        recreateFile(message);

    }).catch(error => {
        console.error(error.message);
    });

}
const url = `${HOST}:${CI_PORT}/scripts/deploy`;
console.log(url);
console.log(args[2]);


deploy(url, args[2], args[3], args[4]).then(
    (res) => { console.log("Done") }
).catch(
    (err) => { console.log(err.message) }
);

// deploy(url, args[], "container", "changes").then(() => { console.log("Done") }).catch((err) => { console.log(err.message) });
