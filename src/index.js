const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const tar = require('tar');
const AdmZip = require('adm-zip');
const { execSync } = require("child_process");

var isWin = process.platform === "win32";
var isLinux = process.platform === "linux";
var isMac = process.platform === "darwin";
var isUnix = isLinux || isMac;

function getfileext(filepath) {
    var ext = filepath.substring(filepath.indexOf('.'));
    return ext;
}
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function downloadfile(url, outputfile) {
    var command = "curl -L " + url + " -o " + outputfile;
    if (isUnix) {
               command = "curl -L " + url + " -o " + outputfile;
    } else {
               command = "curl.exe -L " + url + " -o " + outputfile;
    }
    child = execSync(command, null);
}

async function unzipdir(inputpath,outputpath) {
var ext = getfileext(inputpath)
if (ext == ".zip") {
fs.mkdirSync(outputpath, { recursive: true })
const zip = new AdmZip(inputpath);
zip.extractAllTo(outputpath,true);
} else if (ext == ".tar.gz") {
fs.mkdirSync(outputpath, { recursive: true })
await tar.x({
    file: inputpath,
    C: outputpath,
})
} else {
    throw new Error('unable to unzip file type of ' + ext + "'");
}
}

function removedir(path) {
 fs.rmSync(path, { recursive: true, force: true });
 }

function removefile(path) {
 fs.unlinkSync(path);
 }

function addpath(path) {
    core.addPath(path);
}

function revolvewindowspath(path) {
}
async function main() {
var flag_Add_Path = true; 

var versiontodownload = github.getInput('version');
if (versiontodownload == "") {
     versiontodownload = "latest";
}
try {
const data = fs.readFileSync('database.json', 'utf8');
const databaseinfo = JSON.parse(data);

var foundversion = false;

for (var i = 0; i < databaseinfo.versions.length; i++) {
var programversion = databaseinfo.versions[i]
if (programversion.version == versiontodownload || (i == databaseinfo.versions.length - 1 && versiontodownload == "latest")) {

var downloadurl = programversion.downloadurl
for (var i = 0; i < programversion.programs.length; i++) {
    var program = programversion.programs[i]
    if (program.os == process.platform && (program.arch == process.arch || program.arch == "universal")) {
        console.log("downloading " + programversion.version + " " + program.os + "-" + program.arch);
        fs.mkdirSync(programversion.installdir, { recursive: true })

        var hassinglefile = programversion.singlefile != ""
        var singlefiledir = ""
        if (hassinglefile) {
            var singlefilepath = programversion.installdir + "/" + programversion.singlefile
            singlefiledir = singlefilepath.substring(0, singlefilepath.indexOf('.'))
            downloadfile(downloadurl + "/" + programversion.singlefile, singlefilepath)
            await unzipdir(singlefilepath, singlefiledir)
            removefile(singlefilepath)
        }

        for (var i = 0; i < program.paths.length; i++) {
            addpath(program.paths[i])
        }
        for (var i = 0; i < program.files.length; i++) {
            var newfile = program.files[i]
            var unzip = endsWith(newfile.fileoutput, "**")

            if (hassinglefile) {
            var movedir = singlefiledir + "/" + program.os + "-" + program.arch
            if (unzip) {
             var movefilepath = movedir + "/" + newfile.fileinput
             var outpath = newfile.fileoutput
             outpath = outpath.substr(0, outpath.length - 2)
             await unzipdir(movefilepath, outpath)
            } else 
 {
            var movefilepath = movedir + "/" + newfile.fileinput
            var outpath = newfile.fileoutput
            var d = path.dirname(outpath)
            fs.mkdirSync(d, { recursive: true })
            fs.renameSync(movefilepath, outpath);
            if (newfile.isexecutable) { fs.chmodSync(outpath, fs.constants.X_OK) }
}
   } else {
             if (unzip) {
                       var ext = getfileext(newfile.fileinput)
                       var name = newfile.fileoutput.substr(0, newfile.fileoutput.length -2)
                       var newp = name + ext

                       var d = path.dirname(newp)
                       fs.mkdirSync(d, { recursive: true })

                       downloadfile(downloadurl + "/" + newfile.fileinput, newp)
                       await unzipdir(newp, name)
                       removefile(newp)
            } else {
            var d = path.dirname(newfile.fileoutput)
            fs.mkdirSync(d, { recursive: true })
            downloadfile(downloadurl + "/" + newfile.fileinput, newfile.fileoutput)
            if (newfile.isexecutable)  {  fs.chmodSync(newfile.fileoutput, fs.constants.X_OK) }
            }
        }
 } 
        if (hassinglefile) {
           removedir(singlefiledir);
        }
        foundversion = true
        break
    }
}
if (foundversion) {
    break
}
}
}
} catch (err) {
console.error("failed to install program because of error");
 console.error(err); process.exit(1); 
}
if (!foundversion) {
console.log("This Program cant be Installed on this system");
process.exit(1);
}

}
main();