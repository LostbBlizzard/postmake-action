const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require("child_process");

var isWin = process.platform === "win32";
var isLinux = process.platform === "linux";
var isMac = process.platform === "darwin";
var isUnix = isLinux || isMac;


function downloadfile(url, outputfile) {
    var command = "curl -L " + url + " -o " + outputfile;
    if (isUnix) {
               command = "curl -L " + url + " -o " + outputfile;
    } else {
               command = "curl.exe -L " + url + " -o " + outputfile;
    }
    child = execSync(command, null);
}

function addpath(path) {
    core.addPath(path);
}


if (isWin && process.arch == "x64") {
    downloadfile("https://github.com/LostbBlizzard/postmake/releases/tag/Release-0.0.1/postmake.exe","~/.postmake/postmake.exe");

    if (flag_Add_Path) {
        addpath("~/.postmake/");
    }

}
else if (isLinux && process.arch == "x64") {
    downloadfile("https://github.com/LostbBlizzard/postmake/releases/tag/Release-0.0.1/postmake","~/.postmake/postmake");

    if (flag_Add_Path) {
        addpath("~/.postmake/");
    }

}
else if (isMac && process.arch == "arm64") {
    downloadfile("https://github.com/LostbBlizzard/postmake/releases/tag/Release-0.0.1/postmake_macos","~/.postmake/postmake");

    if (flag_Add_Path) {
        addpath("~/.postmake/");
    }

}
else {
    console.log("This Program has cant be Installed on this system");
    process.exit(1)
}
