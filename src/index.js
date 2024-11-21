const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const tar = require('tar');
const AdmZip = require('adm-zip');
const { execSync } = require("child_process");
const homedir = require('os').homedir();

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
if (inputpath.endsWith(".zip")) {
fs.mkdirSync(outputpath, { recursive: true })
const zip = new AdmZip(inputpath);
zip.extractAllTo(outputpath,true);
} else if (inputpath.endsWith(".tar.gz")) {
fs.mkdirSync(outputpath, { recursive: true })
await tar.x({
    file: inputpath,
    C: outputpath,
})
} else {
    throw new Error('unable to unzip file type of ' + inputpath + "'");
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

function revolvepath(path) {

var r = path.replaceAll("~/", homedir + "/")
if (process.platform == "windows") {
r = path.replaceAll("/", "\\")
}

return r
}
async function main() {
var flag_Add_Path = true; 

var versiontodownload = core.getInput('version');
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
        fs.mkdirSync(revolvepath(programversion.installdir), { recursive: true })

        var hassinglefile = programversion.singlefile != ""
        var singlefiledir = ""
        if (hassinglefile) {
            var singlefilepath = revolvepath(programversion.installdir) + "/" + programversion.singlefile
            singlefiledir = revolvepath(programversion.installdir) + "/" + programversion.singlefile.substring(0, programversion.singlefile.indexOf('.'))
            downloadfile(downloadurl + "/" + programversion.singlefile, singlefilepath)
            await unzipdir(singlefilepath, singlefiledir)
            removefile(singlefilepath)
        }

        for (var i = 0; i < program.paths.length; i++) {
            addpath(revolvepath(program.paths[i]))
        }
        for (var i = 0; i < program.files.length; i++) {
            var newfile = program.files[i]
            var unzip = endsWith(newfile.fileoutput, "**")

            if (hassinglefile) {
            var movedir = singlefiledir + "/" + program.os + "-" + program.arch
            if (unzip) {
             var movefilepath = movedir + "/" + newfile.fileinput
             var outpath = revolvepath(newfile.fileoutput)
             outpath = outpath.substr(0, outpath.length - 2)
             await unzipdir(movefilepath, outpath)
            } else 
 {
            var movefilepath = movedir + "/" + newfile.fileinput
            var outpath = revolvepath(newfile.fileoutput)
            var d = path.dirname(outpath)
            fs.mkdirSync(d, { recursive: true })
            fs.renameSync(movefilepath, outpath);
            if (newfile.isexecutable) { fs.chmodSync(outpath, 0o775) }
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
            var filepath = revolvepath(newfile.fileoutput)
            var d = path.dirname(newfile.fileoutput)
            fs.mkdirSync(d, { recursive: true })
            downloadfile(downloadurl + "/" + newfile.fileinput, filepath)
            if (newfile.isexecutable)  {  fs.chmodSync(filepath, 0o775) }
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