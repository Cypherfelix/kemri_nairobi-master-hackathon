<?php
getcwd();
print(getcwd());
$path = getcwd();
$currentStatus = [];
$jsonFilePath = 'status.json';
//check if json file does not exist create an new file 
if (!file_exists($jsonFilePath)) {
    $file = fopen($jsonFilePath, "w");
    fclose($file);
}


readPath($path, $currentStatus);

while (true) {
    clearCache($path);
    checkPath($path);
    sleep(1);
}

function clearCache($path)
{
    clearstatcache(false, $path);
}

function readPath($path, &$filesMap)
{

    if (ignoreFile($path) === true) {
    } else {
        if ($path != getcwd()) {
            $filesMap[$path] = filemtime($path);
        }
        if (is_dir($path)) {
            $files = scandir($path);
            foreach ($files as $file) {
                if ($file == '.' || $file == '..'  || ignoreFile($path) === true) {
                    continue;
                }
                $fileName = $path . DIRECTORY_SEPARATOR . $file;
                $filesMap[$fileName] = filemtime($fileName);
                if (is_dir($fileName)) {
                    readPath($fileName, $filesMap);
                }
            }
        }
    }
}

function checkPath($path)
{
    global $currentStatus, $jsonFilePath;
    $newStatus = [];
    readPath($path, $newStatus);
    $changes = [];

    foreach ($currentStatus as $file => $time) {
        if (ignoreFile($file) === true) {
            continue;
        }
        if (!isset($newStatus[$file])) {
            $changes[] = [
                'action' => 'delete',
                'file' => $file
            ];
            unset($currentStatus[$file]);
        } else if ($newStatus[$file] != $time) {
            $changes[] = [
                'action' => 'update',
                'file' => $file
            ];
            $currentStatus[$file] = $newStatus[$file];
        }
    }

    foreach ($newStatus as $file => $time) {
        if (!isset($currentStatus[$file])) {
            $changes[] = [
                'action' => 'create',
                'file' => $file
            ];
            $currentStatus[$file] = $newStatus[$file];
        }
    }

    if (!empty($changes)) {
        $status = json_decode(file_get_contents($jsonFilePath), true) ?? [];
        foreach ($changes as $change) {
            $key = md5($change['file']);
            if (isset($status[$key]) && $status[$key]['action'] == 'delete' && $change['action'] == 'create') {
                unset($status[$key]);
            } else {
                $status[$key] = $change;
            }
        }
        file_put_contents($jsonFilePath, json_encode($status));
    }
}

function ignoreFile($filePath)
{
    // Load the .gitignore file into an array
    $ignorePatterns = file('.gitignore', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    // Check if the file matches any patterns in the .gitignore file
    foreach ($ignorePatterns as $pattern) {
        if (fnmatch($pattern, $filePath)) {
            return true;
        }
    }

    // If the file does not match any patterns in the .gitignore file, return false
    return false;
}

function logGitChanges($filePath)
{

    print("Logging changes");
    // Get the Git repository root directory
    $repoRoot = exec('git rev-parse --show-toplevel');

    // Get the list of changed files
    $output = [];
    exec("git diff --name-only HEAD", $output);

    // Open the log file for appending
    $logFile = fopen("git_changes.log", "a");

    // Write the changed files to the log file
    foreach ($output as $file) {
        fwrite($logFile, "$repoRoot/$file\n");
    }

    // Close the log file
    fclose($logFile);
}
