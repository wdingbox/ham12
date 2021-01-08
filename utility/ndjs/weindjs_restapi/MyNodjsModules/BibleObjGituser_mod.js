

const fs = require('fs');
const path = require('path');
var url = require('url');
const fsPromises = require("fs").promises;

//var Uti = require("./Uti.module").Uti;
//var SvcUti = require("./SvcUti.module").SvcUti;
const exec = require('child_process').exec;

var btoa = require('btoa');



var BibleUti = {
    GetFilesAryFromDir: function (startPath, deep, cb) {//startPath, filter
        function recursiveDir(startPath, deep, outFilesArr) {
            var files = fs.readdirSync(startPath);
            for (var i = 0; i < files.length; i++) {
                var filename = path.join(startPath, files[i]);
                //console.log(filename);
                var stat = fs.lstatSync(filename);
                if (stat.isDirectory()) {
                    if (deep) {
                        recursiveDir(filename, deep, outFilesArr); //recurse
                    }
                    continue;
                }/////////////////////////
                else if (cb) {
                    //console.log("file:",filename)
                    if (!cb(filename)) continue
                }
                outFilesArr.push(filename);
            };
        };/////////////////////////////////////

        var outFilesArr = [];
        recursiveDir(startPath, deep, outFilesArr);
        return outFilesArr;
    },
    access_dir: function (http, dir) {
        function writebin(pathfile, contentType, res) {
            var content = fs.readFileSync(pathfile)
            //console.log("read:", pathfile)
            res.writeHead(200, { 'Content-Type': contentType });
            res.write(content, 'binary')
            res.end()
        }
        function writetxt(pathfile, contentType, res) {
            var content = fs.readFileSync(pathfile, "utf8")
            //console.log("read:", pathfile)
            res.writeHead(200, { 'Content-Type': contentType });
            res.write(content, 'utf-8')
            res.end()
        }
        // ./assets/ckeditor/ckeditor.js"
        // var dir = "./assets/ckeditor/"
        console.log("lib svr:", dir)
        var ftypes = {
            '.ico': 'image/x-icon',
            '.html': 'text/html',
            '.htm': 'text/html',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.css': 'text/css',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.eot': 'appliaction/vnd.ms-fontobject',
            '.ttf': 'aplication/font-sfnt'
        }
        var binaries = [".png", ".jpg", ".wav", ".mp3", ".svg", ".pdf", ".eot"]
        BibleUti.GetFilesAryFromDir(dir, true, function (fname) {
            var ret = path.parse(fname);
            var ext = ret.ext
            //console.log("ret:",ret)
            if (ftypes[ext]) {
                console.log("base:", ret.base)
                console.log("api:", fname)
                http.use("/" + fname, async (req, res) => {
                    console.log('[post] resp write :', req.body, fname)
                    if (binaries.indexOf(ext) >= 0) {
                        writebin(fname, ftypes[ext], res)
                    } else {
                        writetxt(fname, ftypes[ext], res)
                    }
                })
                return true
            }
        });
    },
    GetFileSize: function (fnm) {
        if (fs.existsSync(fnm)) {
            const stats = fs.statSync(fnm);
            return stats.size;
        }
        return -1;
    },
    exec_Cmd: async function (command) {
        return new Promise(async (resolve, reject) => {
            try {
                //command = "ls"
                console.log('cmd:', command)
                exec(command, (err, stdout, stderr) => {
                    console.log('exec_Cmd err ', err)
                    console.log('exec_Cmd output ', stdout)
                    console.log('exec_Cmd stderr ', stderr)
                    if (err) {
                        //some err occurred
                        console.error(err);
                        reject(err);
                    } else {
                        // the *entire* stdout and stderr (buffered)

                        //resolve(stdout);
                        resolve(resolve({
                            stdout: (stdout),
                            stderr: stderr,
                            err: err
                            //stderr: stderr 
                        }))
                    }
                });
            } catch (err) {
                console.log(err)
                reject(err);
            }
        })
    },








    fetch_bcv: function (BibleObj, oj) {
        //console.log("fetch_bcv oj", JSON.stringify(oj, null, 4))
        if (!oj || Object.keys(oj).length === 0) return BibleObj
        var retOb = {}
        for (const [bkc, chpObj] of Object.entries(oj)) {
            retOb[bkc] = {}
            if (!chpObj || Object.keys(chpObj).length === 0) {
                retOb[bkc] = BibleObj[bkc]
                continue
            }
            for (const [chp, vrsObj] of Object.entries(chpObj)) {
                //console.log("bc", bkc, chp)
                if (!vrsObj || Object.keys(vrsObj).length === 0) {
                    retOb[bkc][chp] = BibleObj[bkc][chp]
                    continue
                }
                retOb[bkc][chp] = {}
                for (const [vrs, txt] of Object.entries(vrsObj)) {
                    //console.log(`${key}: ${value}`);
                    retOb[bkc][chp][vrs] = BibleObj[bkc][chp][vrs]
                }
            }
        }
        return retOb
    },
    convert_rbcv_2_bcvR: function (rbcv, bcvRobj) {
        if (null === bcvRobj) bcvRobj = {}
        for (const [rev, revObj] of Object.entries(rbcv)) {
            for (const [vol, chpObj] of Object.entries(revObj)) {
                if (!bcvRobj[vol]) bcvRobj[vol] = {}
                for (const [chp, vrsObj] of Object.entries(chpObj)) {
                    if (!bcvRobj[vol][chp]) bcvRobj[vol][chp] = {}
                    for (const [vrs, txt] of Object.entries(vrsObj)) {
                        if (!bcvRobj[vol][chp][vrs]) bcvRobj[vol][chp][vrs] = {}
                        bcvRobj[vol][chp][vrs][rev] = txt
                    };
                };
            };
        };
        return bcvRobj;
    },

    search_str_in_bcvR: function (bcvR, Fname, searchStrn) {
        var retOb = {}
        for (const [bkc, chpObj] of Object.entries(bcvR)) {
            for (const [chp, vrsObj] of Object.entries(chpObj)) {
                for (const [vrs, revObj] of Object.entries(vrsObj)) {
                    var bFound = false
                    for (const [rev, txt] of Object.entries(revObj)) {
                        if (rev === Fname) {
                            var rep = new RegExp(searchStrn, "g");
                            var mat = txt.match(rep);
                            if (mat) {
                                bFound = true
                                var txtFound = txt.replace(mat[0], "<font class='matInSvr'>" + mat[0] + "</font>");
                                bcvR[bkc][chp][vrs][rev] = txtFound
                            }
                        }
                    }
                    if (bFound) {
                        for (const [rev, txt] of Object.entries(revObj)) {
                            if (!retOb[bkc]) retOb[bkc] = {}
                            if (!retOb[bkc][chp]) retOb[bkc][chp] = {};//BibleObj[bkc][chp]
                            if (!retOb[bkc][chp][vrs]) retOb[bkc][chp][vrs] = {};//BibleObj[bkc][chp]
                            retOb[bkc][chp][vrs][rev] = txt
                        }
                    }
                }
            }
        }
        return retOb
    },
    bcv_parser: function (sbcv, txt) {
        sbcv = sbcv.replace(/\s/g, "");
        if (sbcv.length === 0) return alert("please select an item first.");
        var ret = { vol: "", chp: "", vrs: "" };
        var mat = sbcv.match(/^(\w{3})\s{,+}(\d+)\s{,+}[\:]\s{,+}(\d+)\s{,+}$/);
        var mat = sbcv.match(/^(\w{3})\s+(\d+)\s+[\:]\s+(\d+)\s+$/);
        var mat = sbcv.match(/^(\w{3})(\d+)\:(\d+)$/);
        if (mat) {
            ret.vol = mat[1].trim();
            ret.chp = "" + parseInt(mat[2]);
            ret.vrs = "" + parseInt(mat[3]);
        } else {
            alert("sbcv=" + sbcv + "," + JSON.stringify(ret));
        }
        ret.chp3 = ret.chp.padStart(3, "0");
        ret._vol = "_" + ret.vol;

        ret.std_bcv = `${ret.vol}${ret.chp}:${ret.vrs}`

        var pad3 = {}
        pad3.chp = ret.chp.padStart(3, "0");
        pad3.vrs = ret.vrs.padStart(3, "0");
        pad3.bcv = `${ret.vol}${pad3.chp}:${pad3.vrs}`
        ret.pad3 = pad3

        var obj = {}
        obj[ret.vol] = {}
        obj[ret.vol][ret.chp] = {}
        obj[ret.vol][ret.chp][ret.vrs] = txt
        ret.bcvObj = obj

        ///////validation for std bcv.
        // if (undefined === _Max_struct[ret.vol]) {
        //     ret.err = `bkc not exist: ${ret.vol}`
        // } else if (undefined === _Max_struct[ret.vol][ret.chp]) {
        //     ret.err = `chp not exist: ${ret.chp}`
        // } else if (undefined === _Max_struct[ret.vol][ret.chp][ret.vrs]) {
        //     ret.err = `vrs not exist: ${ret.vrs}`
        // } else {
        //     ret.err = ""
        // }

        return ret;
    },


    load_BibleObj_by_fname: function (jsfnm) {
        var ret = { obj: null, fname: jsfnm, fsize: -1, header: "", };

        if (!fs.existsSync(jsfnm)) {
            console.log("f not exit:", jsfnm)
            return ret;
        }
        ret.fsize = BibleUti.GetFileSize(jsfnm);
        if (ret.fsize > 0) {
            var t = fs.readFileSync(jsfnm, "utf8");
            var i = t.indexOf("{");
            if (i > 0) {
                ret.header = t.substr(0, i);
                var s = t.substr(i);
                ret.obj = JSON.parse(s);
            }
        }

        ret.writeback = function () {
            var s2 = JSON.stringify(this.obj, null, 4);
            fs.writeFileSync(this.fname, this.header + s2);
        }
        return ret;
    },
    inpObj_to_karyObj: function (inpObj) {
        var keyObj = { kary: [] }
        for (const [bkc, chpObj] of Object.entries(inpObj)) {
            keyObj.bkc = bkc
            keyObj.kary.push(bkc)
            for (const [chp, vrsObj] of Object.entries(chpObj)) {
                keyObj.chp = chp
                keyObj.kary.push(chp)
                for (const [vrs, txt] of Object.entries(vrsObj)) {
                    keyObj.vrs = vrs
                    keyObj.txt = txt
                    keyObj.kary.push(vrs)
                    keyObj.kary.push(txt)
                }
            }
        }
        return keyObj;
    },

    Write2vrs_txt_by_inpObj: function (jsfname, doc, inpObj, bWrite) {
        var out = {}
        var bib = BibleUti.load_BibleObj_by_fname(jsfname);
        out.m_fname = bib.fname

        if (bib.fsize > 0) {
            console.log("fsize:", bib.fsize)
            for (const [bkc, chpObj] of Object.entries(inpObj)) {
                console.log("chpObj", chpObj)
                for (const [chp, vrsObj] of Object.entries(chpObj)) {
                    console.log("vrsObj", vrsObj)
                    for (const [vrs, txt] of Object.entries(vrsObj)) {
                        var readtxt = bib.obj[bkc][chp][vrs]
                        out.data = { dbcv: `${doc}~${bkc}${chp}:${vrs}`, txt: readtxt }
                        console.log("origtxt", readtxt)

                        if (bWrite) {
                            console.log("newtxt", txt)
                            bib.obj[bkc][chp][vrs] = txt
                            bib.writeback();
                            out.desc += ":Write-success"
                        } else {
                            out.desc += ":Read-success"
                        }
                    }
                }
            }
        }
        return out
    },



    Parse_post_req_to_inp: function (req, res, cbf) {
        console.log("req.method", req.method)
        console.log("req.url", req.url)

        //req.pipe(res)
        if (req.method === "POST") {
            //req.pipe(res)
            console.log("POST: ----------------", "req.url=", req.url)
            var body = "";
            req.on("data", function (chunk) {
                body += chunk;
                console.log("on post data:", chunk)
            });

            req.on("end", async function () {
                console.log("on post eend:", body)

                var inpObj = JSON.parse(body)
                inpObj.out = { data: null, desc: "", state: { bGitDir: -1, bMyojDir: -1, bDatDir: -1, bEditable: -1, bRepositable: -1 } }
                console.log("POST:3 inp=", JSON.stringify(inpObj, null, 4));


                console.log("cbf start ------------------------------")
                await cbf(inpObj)

                res.writeHead(200, { "Content-Type": "application/json" });
                res.write(JSON.stringify(inpObj))
                res.end();
                console.log("finished post req------------------------------")
            });
        } else {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end();
            console.log("end of req")
        }
    },
    Parse_req_GET_to_inp: function (req) {
        console.log("\n\n\n-req.method (GET?)", req.method)
        console.log("-GET: req.url=", req.url);
        console.log("-req.query", req.query)

        if (req.method !== "GET") {
            return null
        }
        //console.log("GET: req.url=", req.url);
        //var q = url.parse(req.url, true).query;
        //console.log("q=", q);
        if (req.query.inp === undefined) {
            console.log("q.inp undefined. Maybe unload or api err");
            return null;
        }
        var sin = decodeURIComponent(req.query.inp);//must for client's encodeURIComponent
        var inpObj = JSON.parse(sin);
        inpObj.out = { data: null, desc: "", state: { bGitDir: -1, bMyojDir: -1, bDatDir: -1, bEditable: -1, bRepositable: -1 } }
        console.log("GET: inp =", JSON.stringify(inpObj, null, 4));
        //cbf(inpObj, res)
        return inpObj
    },
    //// BibleUti /////
}









var BibleObjGituser = function (rootDir) {
    this.set_rootDir(rootDir)
}
BibleObjGituser.prototype.set_rootDir = function (rootDir) {
    this.m_rootDir = rootDir
}

BibleObjGituser.prototype.git_proj_parse = function (inp) {
    this.m_inp = inp
    if (!inp || !inp.out) {
        return null
    }

    if ("object" !== typeof inp.usr) {
        console.log("inp is not valid.")
        inp.out.desc = "null=inp.usr "
        return null
    }

    function _parse_proj_url(proj_url) {
        //https://github.com/wdingbox/Bible_obj_weid.git
        var reg = new RegExp(/^https\:\/\/github\.com\/(\w+)\/(\w+)(\.git)$/)

        var mat = proj_url.match(/^https\:\/\/github\.com[\/](([^\/]*)[\/]([^\.]*))[\.]git$/)
        if (mat && mat.length === 4) {
            console.log("mat:", mat)
            //return { format: 2, desc: "full_path", full_path: mat[0], user_repo: mat[1], user: mat[2], repo: mat[3] }
            var username = mat[2]
            var projname = mat[3]
            return { username: username, projname: projname }
        }
        return null
    }
    function _decode_passcode(inp) {
        ////decode: password.
        if (1 === inp.usr.passcode_encrypted) {
            inp.usr.passcode = btoa(inp.usr.passcode);//.trim()
        } else {
            console.log("password not encrypted.", inp.usr.passcode)
        }
    }
    function _check_pub_testing(inp) {
        ////SpecialTestRule: repopath must be same as password.
        inp.usr.repopath = inp.usr.repopath.trim()
        const PUB_TEST = "pub_test"
        if (inp.usr.proj.projname.indexOf(PUB_TEST) === 0) {
            if (inp.usr.proj.projname !== inp.usr.passcode) {
                console.log("This is for pub_test only but discord to the rule.")
                return null
            } else {
                console.log("This is for pub_test only: sucessfully pass the rule.")
                inp.usr.passcode = "3edcFDSA"
            }
        }
        return inp.usr
    }
    function _parse_proj_dir(inp) {
        const base_Dir = "bible_study_notes/usrs"
        var gitDir = `${base_Dir}/${inp.usr.proj.username}/${inp.usr.proj.projname}`
        var rw_Dir = `${gitDir}/account`
        var tarDir = `${rw_Dir}/myoj`
        var datDir = `${rw_Dir}/dat`

        inp.usr.proj.base_Dir = base_Dir
        inp.usr.proj.git_root = `${gitDir}`
        inp.usr.proj.acct_dir = `${rw_Dir}`
        inp.usr.proj.dest_myo = `${tarDir}`
        inp.usr.proj.dest_dat = `${datDir}`

        inp.usr.proj.git_Usr_Pwd_Url = ""
        if (inp.usr.passcode.trim().length > 0) {
            inp.usr.proj.git_Usr_Pwd_Url = `https://${inp.usr.proj.username}:${inp.usr.passcode}@github.com/${inp.usr.proj.username}/${inp.usr.proj.projname}.git`
        }
        console.log("parse: inp.usr.proj=", inp.usr.proj)
    }


    inp.usr.proj = _parse_proj_url(inp.usr.repopath)
    if (!inp.usr.proj) {
        inp.out.desc = "invalid repospath."
        return null;
    }

    _decode_passcode(inp)

    if (null === _check_pub_testing(inp)) {
        inp.out.desc = "failed pub test."
        return null
    }

    inp.usr.repodesc = inp.usr.repodesc.trim().replace(/[\r|\n]/g, ",")//:may distroy cmdline.

    _parse_proj_dir(inp)

    return inp.usr.proj
}
BibleObjGituser.prototype.get_usr_acct_dir = function (subpath) {
    if (!this.m_inp.usr.proj) return ""
    if (!subpath) {
        return `${this.m_rootDir}${this.m_inp.usr.proj.acct_dir}`
    }
    return `${this.m_rootDir}${this.m_inp.usr.proj.acct_dir}${subpath}`
}
BibleObjGituser.prototype.get_usr_myoj_dir = function (subpath) {
    if (!this.m_inp.usr.proj) return ""
    if (!subpath) {
        return `${this.m_rootDir}${this.m_inp.usr.proj.dest_myo}`
    }
    return `${this.m_rootDir}${this.m_inp.usr.proj.dest_myo}${subpath}`
}
BibleObjGituser.prototype.get_usr_dat_dir = function (subpath) {
    if (!this.m_inp.usr.proj) return ""
    if (!subpath) {
        return `${this.m_rootDir}${this.m_inp.usr.proj.dest_dat}`
    }
    return `${this.m_rootDir}${this.m_inp.usr.proj.dest_dat}${subpath}`
}

BibleObjGituser.prototype.get_usr_git_dir = function (subpath) {
    if (!this.m_inp.usr.proj) return ""
    if (undefined === subpath || null === subpath) {
        return `${this.m_rootDir}${this.m_inp.usr.proj.git_root}`
    }
    return `${this.m_rootDir}${this.m_inp.usr.proj.git_root}${subpath}`
}
BibleObjGituser.prototype.get_pfxname = function (DocCode) {
    var inp = this.m_inp
    //var DocCode = inp.par.fnames[0]
    if (!DocCode || !inp.usr.proj) return ""
    var dest_pfname = ""
    switch (DocCode[0]) {
        case "_": //: _myNode, _myTakeaway,
            {
                var fnam = DocCode.substr(1)
                if (inp.usr.proj) {
                    dest_pfname = this.get_usr_myoj_dir(`/${fnam}_json.js`)
                }
            }
            break
        case ".": //: ./Dat/localStorage
            {
                var pfnam = DocCode.substr(1)
                if (inp.usr.proj) {
                    dest_pfname = this.get_usr_acct_dir(`${pfnam}_json.js`)
                }

            }
            break;
        default: //: NIV, CUVS,  
            dest_pfname = `${this.m_rootDir}bible_obj_lib/jsdb/jsBibleObj/${DocCode}.json.js`;
            break;
    }
    return dest_pfname
}


BibleObjGituser.prototype.git_proj_destroy = async function (res) {
    var inp = this.m_inp
    var proj = inp.usr.proj;
    if (!proj) {
        console.log("failed git setup", inp)
        return inp
    }

    //console.log("proj", proj)
    var password = "lll" //dev mac
    var git_setup_cmd = `
#!/bin/sh
cd ${this.m_rootDir}
echo ${password} | sudo -S rm -rf ${proj.git_root}
echo " git_setup_cmd end."
#cd -`

    var gitdir = this.get_usr_git_dir()
    if (fs.existsSync(`${gitdir}`)) {
        inp.out.exec_git_cmd_result = await BibleUti.exec_Cmd(git_setup_cmd)
        inp.out.git_setup_cmd = git_setup_cmd
        inp.out.desc += "destroyed git dir: " + gitdir
    }
    return inp
}
BibleObjGituser.prototype.git_clone = async function (res) {
    var _THIS = this
    var inp = this.m_inp
    var proj = inp.usr.proj;
    if (!proj) {
        inp.out.desc += ", failed inp.usr parse"
        console.log("failed-git-parse", inp.out.desc)
        return inp
    }

    inp.out.git_clone_res = { desc: "git-clone", bExist: false }
    var gitdir = this.get_usr_git_dir("/.git")
    if (fs.existsSync(gitdir)) {
        inp.out.git_clone_res.desc += ",already done."
        inp.out.git_clone_res.bExist = true
        return inp
    }

    var clone_https = inp.usr.proj.git_Usr_Pwd_Url
    if (clone_https.length === 0) {
        clone_https = inp.usr.repopath
    }
    if (clone_https.length === 0) {
        inp.out.git_clone_res.desc += ",no url."
        return inp
    }
    console.log("to clone: ", clone_https)

    //console.log("proj", proj)
    var password = "lll" //dev mac
    var git_clone_cmd = `
#!/bin/sh
cd ${this.m_rootDir}
echo ${password} | sudo -S GIT_TERMINAL_PROMPT=0 git clone  ${clone_https}  ${proj.git_root}
if [ -f "${proj.git_root}/.git/config" ]; then
    echo "${proj.git_root}/.git/config exists."
    echo ${password} | sudo -S chmod  777 ${proj.git_root}/.git/config
else 
    echo "${proj.git_root}/.git/config does not exist."
fi
#echo ${password} | sudo -S chmod  777 ${proj.git_root}/.git/config
#cd -`
    console.log("git_clone_cmd", git_clone_cmd)

    //inp.out.git_clone_res.desc += ",clone git dir: " + proj.git_root
    function _check_git_folders_existance() {
        var res = _THIS.m_inp.out.git_clone_res
        if (fs.existsSync(gitdir)) {
            res.bExist = true
        }
        var myojdir = _THIS.get_usr_myoj_dir()
        if (fs.existsSync(myojdir)) {
            res.desc += ", with data."
            res.bGitDat = true
        } else {
            res.desc += ", empty git data."
            res.bGitDat = false
        }
    }
    inp.out.git_clone_res.git_clone_cmd = git_clone_cmd
    await BibleUti.exec_Cmd(git_clone_cmd).then(
        function (val) {
            console.log("git-clone success:", val)
            inp.out.git_clone_res.desc += ", clone success."
            _check_git_folders_existance()
            //this.git_config_allow_push(true)
        },
        function (val) {
            console.log("git-clone failure:", val)
            inp.out.git_clone_res.desc += ", clone success."
            _check_git_folders_existance()
        })
    return inp
}
BibleObjGituser.prototype.cp_template_to_git = async function (res) {
    var inp = this.m_inp
    var proj = inp.usr.proj;
    if (!proj) {
        inp.out.desc += ", failed inp.usr parse"
        console.log("failed git setup", inp.out.desc)
        return inp
    }
    inp.out.desc += ",clone."

    var gitdir = this.get_usr_myoj_dir()
    if (fs.existsSync(`${gitdir}`)) {
        inp.out.desc += ", usr acct already exist: "
        return inp
    }

    //console.log("proj", proj)
    var password = "lll" //dev mac
    var acctDir = this.get_usr_acct_dir()
    var cp_template_cmd = `
#!/bin/sh
echo ${password} | sudo -S mkdir -p ${acctDir}
echo ${password} | sudo -S chmod -R 777 ${acctDir}
#echo ${password} | sudo -S cp -aR  ${this.m_rootDir}bible_obj_lib/jsdb/UsrDataTemplate  ${acctDir}/
echo ${password} | sudo -S cp -aR  ${this.m_rootDir}bible_obj_lib/jsdb/UsrDataTemplate/*  ${acctDir}/.
echo ${password} | sudo -S chmod -R 777 ${acctDir}
echo " cp_template_cmd end."
#cd -`

    inp.out.cp_template_cmd = cp_template_cmd
    console.log("cp_template_cmd", cp_template_cmd)
    inp.out.cp_template_cmd_result = await BibleUti.exec_Cmd(cp_template_cmd)

    if (!fs.existsSync(`${gitdir}`)) {
        inp.out.desc += ", cp failed: "
    }
    return inp
}
BibleObjGituser.prototype.change_dir_perm = async function (dir, mode) {
    // mode : "777" 
    var inp = this.m_inp
    var proj = inp.usr.proj;
    if (!proj) {
        inp.out.desc += ", failed inp.usr parse"
        console.log("failed git setup", inp.out.desc)
        return inp
    }
    console.log("perm:", dir)
    if (!fs.existsSync(dir)) {
        return inp
    }
    var password = "lll"
    var change_perm_cmd = `echo ${password} | sudo -S chmod -R ${mode} ${dir}`
    inp.out.change_perm = {}

    await BibleUti.exec_Cmd(change_perm_cmd).then(
        function (val) {
            inp.out.change_perm.success = val
        },
        function (val) {
            inp.out.change_perm.failure = val
        }
    )

    return inp
}
BibleObjGituser.prototype.git_proj_setup = async function () {
    var inp = this.m_inp
    var proj = inp.usr.proj;
    if (!proj) {
        inp.out.desc += ", failed inp.usr parse"
        console.log("failed git setup", inp.out.desc)
        return null
    }
    inp.out.desc = "setup start."
    await this.git_clone()
    var gitdir = this.get_usr_git_dir("/.git")
    if (!fs.existsSync(gitdir)) {
        inp.out.git_clone_res.bExist = false
        return null
    }
    if (!inp.out.git_clone_res.bExist) return null

    await this.cp_template_to_git()

    var accdir = this.get_usr_acct_dir()
    await this.change_dir_perm(accdir, 777)
    var retp = this.git_proj_status()
    if (retp) {
        await this.git_push()
    }


    return inp
}

BibleObjGituser.prototype.git_proj_status = function (cbf) {
    var inp = this.m_inp
    //inp.out.state = { bGitDir: -1, bMyojDir: -1, bEditable: -1, bRepositable: -1 }

    var accdir = this.get_usr_myoj_dir()
    if (!fs.existsSync(accdir)) {
        return null
    }
    var accdir = this.get_usr_dat_dir()
    if (!fs.existsSync(accdir)) {
        inp.out.state.bDatDir = 0
    }
    inp.out.state.bDatDir = 1

    inp.out.state.bMyojDir = 1

    var gitdir = this.get_usr_git_dir("/.git/config")
    if (!fs.existsSync(gitdir)) {
        return null
    }
    inp.out.state.bGitDir = 1

    var txt = fs.readFileSync(gitdir, "utf8")
    var pos0 = txt.indexOf("[remote \"origin\"]")
    var pos1 = txt.indexOf("[branch \"master\"]")
    inp.out.state.config = txt.substring(pos0 + 19, pos1)

    /////// git status
    if (cbf) cbf()

    inp.out.state.bEditable = inp.out.state.bGitDir * inp.out.state.bMyojDir * inp.out.state.bDatDir
    return inp
}

BibleObjGituser.prototype.git_status = async function () {
    var inp = this.m_inp
    if (!inp.out.state) return console.log("*** Fatal Error: inp.out.state = null")
    var gitdir = this.get_usr_git_dir("/.git/config")
    if (fs.existsSync(gitdir)) {
        /////// git status
        var git_status_cmd = `
        cd ${this.get_usr_git_dir()}
        git status
        git diff --ignore-space-at-eol -b -w --ignore-blank-lines --color-words=.`
        inp.out.git_status = {}
        await BibleUti.exec_Cmd(git_status_cmd).then(
            function (val) {
                inp.out.git_status.success = val
            },
            function (val) {
                inp.out.git_status.failure = val
            }
        )
    }
}

BibleObjGituser.prototype.git_config_allow_push = function (bAllowPush) {
    { /****.git/config
        [core]
                repositoryformatversion = 0
                filemode = true
                bare = false
                logallrefupdates = true
                ignorecase = true
                precomposeunicode = true
        [remote "origin"]
                url = https://github.com/wdingbox/bible_obj_weid.git
                fetch = +refs/heads/*:refs/remotes/origin/*
        [branch "master"]
                remote = origin
                merge = refs/heads/master
        ******/

        //https://github.com/wdingbox/bible_obj_weid.git
        //https://github.com/wdingbox:passcode@/bible_obj_weid.git
    } /////////

    if (!this.m_inp.usr.repopath) return
    if (!this.m_inp.usr.proj) return
    if (!this.m_inp.usr.proj.git_Usr_Pwd_Url) return

    var git_config_fname = this.get_usr_git_dir("/.git/config")
    if (!fs.existsSync(git_config_fname)) {
        console.log(".git/config not exist:", git_config_fname)
        return
    }
    // fs.chmodSync(git_config_fname, 0o777, function (err) {
    //     if (err) console.log(err);
    //     console.log(`The permissions for file ${git_config_fname} have been changed!`)
    // })

    if (!this.m_git_config_old || !this.m_git_config_new) {
        var olds, news, txt = fs.readFileSync(git_config_fname, "utf8")
        var ipos1 = txt.indexOf(this.m_inp.usr.repopath)
        var ipos2 = txt.indexOf(this.m_inp.usr.proj.git_Usr_Pwd_Url)

        console.log("ipos1:", ipos1, this.m_inp.usr.repopath)
        console.log("ipos2:", ipos2, this.m_inp.usr.proj.git_Usr_Pwd_Url)

        if (ipos1 > 0) {
            olds = txt
            news = txt.replace(this.m_inp.usr.repopath, this.m_inp.usr.proj.git_Usr_Pwd_Url)
        }
        if (ipos2 > 0) {
            news = txt
            olds = txt.replace(this.m_inp.usr.proj.git_Usr_Pwd_Url, this.m_inp.usr.repopath)

            console.log("initial git_config_fname not normal:",txt)
        }
        this.m_git_config_old = olds
        this.m_git_config_new = news
    }

    if (bAllowPush) {
        fs.writeFileSync(git_config_fname, this.m_git_config_new, "utf8")
        console.log("bAllowPush=1:url =", this.m_inp.usr.proj.git_Usr_Pwd_Url)
    } else {
        fs.writeFileSync(git_config_fname, this.m_git_config_old, "utf8")
        console.log("bAllowPush=0:url =", this.m_inp.usr.repopath)
    }
}
BibleObjGituser.prototype.git_add_commit_push = async function (msg) {
    var _THIS = this
    var inp = this.m_inp

    password = "lll" //dev mac
    var cmd_commit = `
cd  ${this.get_usr_git_dir()}
echo ${password} | sudo -S git status
echo ${password} | sudo -S git pull
echo ${password} | sudo -S git diff --ignore-space-at-eol -b -w --ignore-blank-lines --color-words=.
echo ${password} | sudo -S git add *
echo ${password} | sudo -S git commit -m "svr update ${msg}. ${inp.usr.repodesc}"
echo ${password} | sudo -S GIT_TERMINAL_PROMPT=0 git push
echo ${password} | sudo -S git status
cd -
`

    console.log("git_config_allow_push true first....")
    this.git_config_allow_push(true)
    inp.out.git_push_res = {}
    await BibleUti.exec_Cmd(cmd_commit).then(
        function (ret) {
            console.log("success:", ret)
            _THIS.git_config_allow_push(false)
            _THIS.m_inp.out.git_push_res.success = ret
            _THIS.m_inp.out.git_push_res.desc = "Reposit success."
            const erry = ["fatal", "Invalid"]
            erry.forEach(function (errs) {
                if (ret.stderr.indexOf(errs) >= 0) {
                    _THIS.m_inp.out.git_push_res.desc = "push failed." + ret.stderr
                }
            })
        },
        function (ret) {
            console.log("failure:", ret)
            _THIS.git_config_allow_push(false)
            inp.out.git_push_res.failure = ret
        }
    )
}
BibleObjGituser.prototype.git_pull = async function (cbf) {
    password = "lll" //dev mac
    var cmd_git_pull = `
#!/bin/sh
cd  ${this.get_usr_git_dir()}
echo ${password} | sudo -S git status
echo ${password} | sudo -S git pull
cd -
`
    var _THIS = this
    if (!_THIS.m_inp.out.git_pull_res) _THIS.m_inp.out.git_pull_res = { bSuccess: -1 }
    this.git_config_allow_push(true)
    await BibleUti.exec_Cmd(cmd_git_pull).then(
        function (val) {
            console.log("success:", val)
            _THIS.git_config_allow_push(false)

            var mat = val.stderr.match(/(fatal)|(fail)|(error)/g)
            _THIS.m_inp.out.git_pull_res.bSuccess = !mat
            _THIS.m_inp.out.git_pull_res = val
            if (cbf) cbf(true)
        },
        function (val) {
            _THIS.m_inp.out.git_pull_res = val
            console.log("failure:", val)
            _THIS.git_config_allow_push(false)
            if (cbf) cbf(false)
        }
    )
}

BibleObjGituser.prototype.git_push = async function () {
    password = "lll" //dev mac
    var cmd_git_pull = `
#!/bin/sh
cd  ${this.get_usr_git_dir()}
echo ${password} | sudo -S GIT_TERMINAL_PROMPT=0 git push
cd -
`




    var _THIS = this
    if (!_THIS.m_inp.out.git_push_res) _THIS.m_inp.out.git_push_res = {}
    //if (!_THIS.m_inp.out.state) _THIS.m_inp.out.state = { bRepositable: -1 }
    this.git_config_allow_push(true)
    await BibleUti.exec_Cmd(cmd_git_pull).then(
        function (ret) {
            console.log("git_push.success:", ret)
            _THIS.git_config_allow_push(false)
            _THIS.m_inp.out.git_push_res.success = ret
            _THIS.m_inp.out.state.bRepositable = 1

            var mat = ret.stderr.match(/(fatal)|(Invalid)/g)
            if (mat) {
                _THIS.m_inp.out.state.bRepositable = 0
            }
            //const erry = ["fatal", "Invalid"]
            //erry.forEach(function (errs) {
            //    if (ret.stderr.indexOf(errs) >= 0) {
            //        _THIS.m_inp.out.state.bRepositable = 0
            //    }
            //})
        },
        function (ret) {
            console.log("git_push.failure:", ret)
            _THIS.git_config_allow_push(false)
            _THIS.m_inp.out.git_push_res.failure = re
        }
    )
}






module.exports = {
    BibleUti: BibleUti,
    BibleObjGituser: BibleObjGituser
}

