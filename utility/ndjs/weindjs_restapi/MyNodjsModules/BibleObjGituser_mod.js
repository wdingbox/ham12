

const fs = require('fs');
const path = require('path');
var url = require('url');
const fsPromises = require("fs").promises;

//var Uti = require("./Uti.module").Uti;
//var SvcUti = require("./SvcUti.module").SvcUti;
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;

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
    GetFileStat: function (fnm) {
        if (fs.existsSync(fnm)) {
            const stats = fs.statSync(fnm);
            return stats;//.size; //mtime modifited
        }
        return { size: -1, mtime: 0 };
    },
    exec_Cmd: function (command) {
        return new Promise((resolve, reject) => {
            try {
                //command = "ls"
                //console.log('exec_Cmd:', command)
                exec(command, (err, stdout, stderr) => {
                    console.log('-exec_Cmd errorr:', err)
                    console.log('-exec_Cmd stderr:', stderr)
                    console.log('-exec_Cmd stdout:', stdout)

                    // the *entire* stdout and stderr (buffered)
                    //resolve(stdout);
                    resolve({
                        stdout: stdout,
                        stderr: stderr,
                        err: err
                    })

                });
            } catch (err) {
                console.log(err)
                reject(err);
            }
        })
    },








    copy_biobj: function (BibleObj, oj) {
        //console.log("copy_biobj oj", JSON.stringify(oj, null, 4))
        if (!oj || Object.keys(oj).length === 0) return BibleObj
        var retOb = {}
        for (const [bkc, chpObj] of Object.entries(oj)) {
            if (!chpObj || Object.keys(chpObj).length === 0) {
                retOb[bkc] = BibleObj[bkc] //copy whole book
                continue
            }
            retOb[bkc] = {}
            for (const [chp, vrsObj] of Object.entries(chpObj)) {
                //console.log("bc", bkc, chp)
                if (!vrsObj || Object.keys(vrsObj).length === 0) {
                    retOb[bkc][chp] = BibleObj[bkc][chp]  //copyy whole chapter
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
    convert_Tbcv_2_bcvT: function (rbcv, bcvRobj) {
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

    search_str_in_bcvT: function (bcvR, Fname, searchStrn) {
        function _parse_global_parm(searchPat) {
            var arsrmat = searchPat.match(/^\/(.*)\/([a-z]*)$/)
            var exparm = "g"
            if (arsrmat && arsrmat.length === 3) {
                console.log(arsrmat)
                searchPat = arsrmat[1]
                exparm += arsrmat[2]
            }
            return { searchPat: searchPat, parm: exparm };
        }
        var parsePat = _parse_global_parm(searchStrn)
        console.log("searchStrn=", searchStrn)
        function _parse_AND(searchPat) {
            var andary = []
            var andmat = searchPat.match(/[\(][\?][\=][\.][\*]([^\)]+)[\)]/g)   //(?=.*Sarai)(?=.*Abram)
            if (andmat) {
                console.log(andmat)
                andmat.forEach(function (fand) {
                    var cors = fand.match(/(?:[\(][\?][\=][\.][\*])([^\)]+)([\)])/)
                    if (cors.length === 3) andary.push(cors[1])
                    console.log("cors", cors)
                })
            }
            return andary;
        }
        var andary = _parse_AND(searchStrn)
        console.log("andary:", andary)


        var retOb = {}
        for (const [bkc, chpObj] of Object.entries(bcvR)) {
            for (const [chp, vrsObj] of Object.entries(chpObj)) {
                for (const [vrs, revObj] of Object.entries(vrsObj)) {
                    var bFound = false
                    for (const [rev, txt] of Object.entries(revObj)) {
                        if (rev === Fname) {
                            var rep = new RegExp(parsePat.searchPat, parsePat.parm);
                            var mat = txt.match(rep);
                            if (mat) {
                                mat.forEach(function (s, i) {
                                    //if (s.length > 0) console.log(i, s)
                                })
                                bFound = true
                                var txtFound = txt

                                if (andary.length === 0) {
                                    var repex = new RegExp(mat[0], parsePat.parm)
                                    txtFound = txt.replace(repex, "<font class='matInSvr'>" + mat[0] + "</font>");
                                } else {
                                    andary.forEach(function (strkey) {
                                        var repex = new RegExp(strkey, parsePat.parm)
                                        txtFound = txtFound.replace(repex, "<font class='matInSvr'>" + strkey + "</font>");
                                    })
                                }

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
    search_str_in_bibObj__not_used: function (bibObj, searchStrn) {
        var retOb = {}
        for (const [bkc, chpObj] of Object.entries(bibObj)) {
            for (const [chp, vrsObj] of Object.entries(chpObj)) {
                for (const [vrs, txt] of Object.entries(vrsObj)) {
                    var rep = new RegExp(searchStrn, "g");
                    var mat = txt.match(rep);
                    if (mat) {
                        var txtFound = txt.replace(mat[0], "<font class='matInSvr'>" + mat[0] + "</font>");

                        if (!retOb[bkc]) retOb[bkc] = {}
                        if (!retOb[bkc][chp]) retOb[bkc][chp] = {};//BibleObj[bkc][chp]
                        if (!retOb[bkc][chp][vrs]) retOb[bkc][chp][vrs] = {};//BibleObj[bkc][chp]
                        retOb[bkc][chp][vrs][rev] = txtFound
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


    loadObj_by_fname: function (jsfnm) {
        var ret = { obj: null, fname: jsfnm, fsize: -1, header: "", err: "" };

        if (!fs.existsSync(jsfnm)) {
            console.log("f not exit:", jsfnm)
            return ret;
        }
        ret.stat = BibleUti.GetFileStat(jsfnm)
        ret.fsize = ret.stat.size;
        if (ret.fsize > 0) {
            var t = fs.readFileSync(jsfnm, "utf8");
            var i = t.indexOf("{");
            if (i > 0) {
                ret.header = t.substr(0, i);
                var s = t.substr(i);
                try {
                    ret.obj = JSON.parse(s);
                } catch (e) {
                    ret.err = e;
                }

            }
        }

        ret.writeback = function () {
            var s2 = JSON.stringify(this.obj, null, 4);
            fs.writeFileSync(this.fname, this.header + s2);
            ret.dlt_size = ret.header.length + s2.length - ret.fsize
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

    ____________Write2vrs_txt_by_inpObj__________: function (jsfname, doc, inpObj, bWrite) {
        var out = {}
        var bib = BibleUti.loadObj_by_fname(jsfname);
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

                var inpObj = null
                try {
                    inpObj = JSON.parse(body)
                    inpObj.out = { data: null, desc: "", err: null, state: { bGitDir: -1, bMyojDir: -1, bDatDir: -1, bEditable: -1, bRepositable: -1 } }
                } catch (err) {
                    inpObj.err = err
                }
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

        var out = { data: null, desc: "", err: null, state: { bGitDir: -1, bMyojDir: -1, bDatDir: -1, bEditable: -1, bRepositable: -1 } }
        try {
            var inpObj = JSON.parse(sin);
            inpObj.out = out
            console.log("GET: inp =", JSON.stringify(inpObj, null, 4));
            //cbf(inpObj, res)
            return inpObj
        } catch (err) {
            out.err = err
            console.log(err)
            return out
        }
    },
    //// BibleUti /////
}



var SvrUsrsBCV = function () {
}
SvrUsrsBCV.prototype.set_rootDir = function (srcpath) {
    this.m_rootDir = srcpath
    this.output = {
        m_olis: [],
        m_totSize: 0,
        m_totFiles: 0,
        m_totDirs: 0
    }
}
SvrUsrsBCV.prototype.getDirectories = function (srcpath) {
    return fs.readdirSync(srcpath).filter(function (file) {
        if ("." === file[0]) return false;
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}
SvrUsrsBCV.prototype.getPathfiles = function (srcpath) {
    return fs.readdirSync(srcpath).filter(function (file) {
        if ("." === file[0]) return false;
        return fs.statSync(srcpath + '/' + file).isFile();
    });
}
SvrUsrsBCV.prototype.getFary = function (srcPath, doc) {
    var fary = this.getPathfiles(srcPath);
    var dary = this.getDirectories(srcPath);
    this.output.m_totDirs += dary.length;
    this.output.m_totFiles += fary.length;

    for (var i = 0; i < dary.length; i++) {
        var spath = dary[i];
        //console.log(spath)
        this.getFary(path.join(srcPath, spath), doc);
    }
    for (var k = 0; k < fary.length; k++) {
        var sfl = fary[k];
        console.log("sfl", sfl, doc)
        if (doc !== sfl) continue
        var pathfile = path.join(srcPath, sfl);
        var stats = fs.statSync(pathfile);
        this.output.m_totSize += stats.size;
        this.output.m_olis.push(pathfile);
    }
}
SvrUsrsBCV.prototype.gen_all_files_of = function (doc) {
    this.getFary(this.m_rootDir, doc)
    return this.output
}






function BibleObjBackendService() {
    this.m_watchAccounts = {}
}
BibleObjBackendService.prototype.set_rootDir = function (rootDir) {
    this.m_rootDir = rootDir
}
BibleObjBackendService.prototype.bind_folder_event = function (dir) {
    var _THIS = this
    if (undefined === this.m_watchAccounts[dir]) {
        this.m_watchAccounts[dir] = 0
        fs.watch(dir, { recursive: true }, function (evt, fname) {
            console.log("\n******************* event:", evt, fname)
            console.log("\n")

        })
        return
    }
}
BibleObjBackendService.prototype.get_rootDir = function (doc) {
    this.m_rootDir = rootDir
}
var g_BibleObjBackendService = new BibleObjBackendService()








var BibleObjGituser = function (rootDir) {
    if (!rootDir.match(/\/$/)) rootDir += "/"
    this.m_rootDir = rootDir


    this.m_sRootNode = "bible_study_notes"
    this.m_sBaseUsrs = `${this.m_sRootNode}/usrs`
    var pathrootdir = rootDir + this.m_sRootNode


    this.m_backendService = g_BibleObjBackendService
    this.m_backendService.set_rootDir(pathrootdir)

    this.m_SvrUsrsBCV = new SvrUsrsBCV()
    this.m_SvrUsrsBCV.set_rootDir(pathrootdir)

}


BibleObjGituser.prototype.proj_parse = function (inp) {
    this.m_inp = inp
    if (!inp || !inp.out) {
        return null
    }
    var _THIS = this



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
    function _decode_passcode(inp_usr) {
        ////decode: password.
        if (1 === inp_usr.passcode_encrypted) {
            inp_usr.passcode = btoa(inp_usr.passcode);//.trim()
        } else {
            console.log("password not encrypted.", inp_usr.passcode)
        }
    }
    function _check_pub_testing(inp_usr) {
        if (inp_usr.passcode.length === 0) {
            return inp_usr
        }
        ////SpecialTestRule: repopath must be same as password.
        inp_usr.repopath = inp_usr.repopath.trim()
        const PUB_TEST = "pub_test"
        if (inp_usr.proj.projname.indexOf(PUB_TEST) === 0) {
            if (inp_usr.proj.projname !== inp_usr.passcode) {
                console.log("This is for pub_test only but discord to the rule.")
                return null
            } else {
                console.log("This is for pub_test only: sucessfully pass the rule.")
                inp_usr.passcode = "3edcFDSA"
            }
        }
        return inp_usr
    }

    function _parse_proj_dir(inp_usr, base_Dir) {
        //const base_Dir = "bible_study_notes/usrs"
        var gitDir = `${base_Dir}/${inp_usr.proj.username}/${inp_usr.proj.projname}`
        var rw_Dir = `${gitDir}/account`
        var tarDir = `${rw_Dir}/myoj`
        var datDir = `${rw_Dir}/dat`

        inp_usr.proj.base_Dir = base_Dir
        inp_usr.proj.git_root = `${gitDir}`
        inp_usr.proj.acct_dir = `${rw_Dir}`
        inp_usr.proj.dest_myo = `${tarDir}`
        inp_usr.proj.dest_dat = `${datDir}`

        inp_usr.proj.git_Usr_Pwd_Url = ""
        if (inp_usr.passcode.trim().length > 0) {
            inp_usr.proj.git_Usr_Pwd_Url = `https://${inp_usr.proj.username}:${inp_usr.passcode}@github.com/${inp_usr.proj.username}/${inp_usr.proj.projname}.git`
        }
        console.log("parse: inp.usr.proj=", inp_usr.proj)
    }


    if ("string" === typeof inp.sid && inp.sid.length > 0) {
        var ret = this.get_session(inp.sid)
    }
    if ("object" === typeof inp.usr) {
        inp.sid = thiis.gen_session(inp.usr)

        inp.usr.proj = _parse_proj_url(inp.usr.repopath)
        if (!inp.usr.proj) {
            inp.out.desc = "invalid repospath."
            return null;
        }

        _decode_passcode(inp.usr)

        if (null === _check_pub_testing(inp.usr)) {
            inp.out.desc = "failed pub test."
            return null
        }

        inp.usr.repodesc = inp.usr.repodesc.trim().replace(/[\r|\n]/g, ",")//:may distroy cmdline.

        _parse_proj_dir(inp.usr, this.m_sBaseUsrs)

    }


    return inp.usr.proj
}
BibleObjGituser.prototype.gen_session = function (inp_usr) {
    var tmp = "sid" + (new Date()).getTime()
    var sess = this.get_proj_tmp_dir(tmp) 
    var txt = JSON.stringify(inp_usr)
    var dat = Buffer.from(txt).toString("base64")
    console.log("_create_session dat", dat)
    fs.writeFile(sess, dat, "utf8", function (err) {
        console.log("save err", err)
    })
    return sess
}
BibleObjGituser.prototype.get_session = function (sid) {
    var sess = this.get_proj_tmp_dir(sid) 
    var dat = fs.readFileSync(sess, "utf8")
    var txt = Buffer.from(dat, 'base64').toString()
    var obj = {}
    try{
        obj = JSON.parse(txt)
    }catch(err){
        console.log("json parse err", err)
    }
    return obj
}
BibleObjGituser.prototype.get_proj_tmp_dir = function (subpath) {
    var dir = `${this.m_rootDir}${this.m_sRootNode}/tmp`
    if (!fs.existsSync(dir)) {
        //fs.mkdirSync(dir, 0777, { recursive: true });
        var password = "lll"
        var command = `
            echo ${password} | sudo -S mkdir -p ${dir}
            echo ${password} | sudo -S chmod 777 ${dir}
            `
        try {
            //command = "ls"
            //console.log('exec_Cmd:', command)
            execSync(command, (err, stdout, stderr) => {
                console.log('-exec_Cmd errorr:', err)
                console.log('-exec_Cmd stderr:', stderr)
                console.log('-exec_Cmd stdout:', stdout)
            });
        } catch (err) {
            console.log(err)
        }
    }
    if (!subpath) {
        subpath = ""
    }
    if (subpath[0] !== "/") subpath = "/" + subpath
    return `${dir}${subpath}`
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
    if (subpath[0] !== "/") subpath = "/" + subpath
    return `${this.m_rootDir}${this.m_inp.usr.proj.git_root}${subpath}`
}

BibleObjGituser.prototype.get_DocCode_Fname = function (DocCode) {
    if (DocCode[0] != "_") return ""
    var fnam = DocCode.substr(1)
    return `${fnam}_json.js`
}
BibleObjGituser.prototype.get_pfxname = function (DocCode) {
    var inp = this.m_inp
    //var DocCode = inp.par.fnames[0]
    if (!DocCode || !inp.usr.proj) return ""
    var dest_pfname = ""
    switch (DocCode[0]) {
        case "_": //: _myNode, _myTakeaway,
            {
                var fnam = this.get_DocCode_Fname(DocCode)
                if (inp.usr.proj) {
                    dest_pfname = this.get_usr_myoj_dir(`/${fnam}`)
                    ////---:
                    if (!fs.existsSync(dest_pfname)) {
                        var src = `${this.m_rootDir}bible_obj_lib/jsdb/UsrDataTemplate/myoj/${fnam}`
                        if (fs.existsSync(src)) {
                            const { COPYFILE_EXCL } = fs.constants;
                            fs.copyFileSync(src, dest_pfname, COPYFILE_EXCL) //failed if des exists.
                        } else {
                            console.log("* * * [Fatal Err] src not exist:", src)
                        }
                    }
                    if (!fs.existsSync(dest_pfname)) {
                        console.log("\n\n* * * [Fatal Err] missing file cannot be fixed:", dest_pfname)
                    }
                    console.log("\n\n* * * my dest_pfname:", dest_pfname)
                }
            }
            break
        case ".": //-: ./dat/localStorage
            {
                var fnam = DocCode.substr(1)
                if (inp.usr.proj) {
                    dest_pfname = this.get_usr_acct_dir(`${fnam}_json.js`)
                    ////---: 
                    if (!fs.existsSync(dest_pfname)) {
                        var src = `${this.m_rootDir}bible_obj_lib/jsdb/UsrDataTemplate${fnam}_json.js`
                        if (fs.existsSync(src)) {
                            const { COPYFILE_EXCL } = fs.constants;
                            fs.copyFileSync(src, dest_pfname, COPYFILE_EXCL) //failed if des exists.
                        } else {
                            console.log("* * * [Fatal Err] src not exist:", src)
                        }
                    }
                    if (!fs.existsSync(dest_pfname)) {
                        console.log("\n\n* * * [Fatal Err] missing file cannot be fixed:", dest_pfname)
                    }
                    console.log("\n\n* * * my dest_pfname:", dest_pfname)
                }

            }
            break;
        default: //: NIV, CUVS,  
            dest_pfname = `${this.m_rootDir}bible_obj_lib/jsdb/jsBibleObj/${DocCode}.json.js`;
            break;
    }
    return dest_pfname
}
BibleObjGituser.prototype.get_session_fname = async function () {
    var sessf = this.get_usr_dat_dir("/session.txt")
    return sessf
}
BibleObjGituser.prototype.proj_sess_write = async function () {
    var sessf = this.get_session_fname()
    fs.writeFile(sessf, atob(JSON.parse(inp.usr)), "utf8")
}
BibleObjGituser.prototype.proj_sess_read = async function () {
    var sessf = this.get_session_fname()
    var dat = fs.readFileSync(sessf, "utf8")
    var txt = btoa(dat)
    var obj = JSON.parse(txt)
    return obj
}
BibleObjGituser.prototype.proj_setup = async function () {
    var inp = this.m_inp
    var proj = inp.usr.proj;
    if (!proj) {
        inp.out.desc += ", failed inp.usr parse"
        console.log("failed git setup", inp.out.desc)
        return null
    }
    inp.out.desc = "setup start."
    var stat = this.profile_state()
    if (stat.bEditable > 0) {
        stat.bExist = 1
        inp.out.desc += "|already setup."
        await this.git_pull()
    }
    if (stat.bGitDir !== 1) {
        await this.git_clone()
        stat = this.profile_state()
    }

    if (stat.bMyojDir !== 1) {
        await this.cp_template_to_git()
        stat = this.profile_state()
    }

    if (stat.bMyojDir === 1) {
        var accdir = this.get_usr_acct_dir()
        await this.chmod_R_(777, accdir)
    }

    this.git_config_allow_push(false)

    var retp = this.profile_state()
    await this.chmod_R_777_acct()



    return inp
}
BibleObjGituser.prototype.proj_destroy = async function () {
    var inp = this.m_inp
    var proj = inp.usr.proj;
    if (!proj) {
        console.log("failed git setup", inp)
        return inp
    }

    //console.log("proj", proj)
    var gitdir = this.get_usr_git_dir()
    var password = "lll" //dev mac
    var proj_destroy = `
    echo ${password} | sudo -S rm -rf ${gitdir}
    `

    if (fs.existsSync(`${gitdir}`)) {
        inp.out.exec_git_cmd_result = await BibleUti.exec_Cmd(proj_destroy)
        inp.out.desc += "destroyed git dir: " + gitdir
    }
    this.profile_state()

    return inp
}
BibleObjGituser.prototype.profile_state = function (cbf) {
    if (!this.m_inp.out || !this.m_inp.out.state) return console.log("******Fatal Error.")
    var stat = this.m_inp.out.state
    //inp.out.state = { bGitDir: -1, bMyojDir: -1, bEditable: -1, bRepositable: -1 }


    stat.bMyojDir = 1
    var accdir = this.get_usr_myoj_dir()
    if (!fs.existsSync(accdir)) {
        stat.bMyojDir = 0
    }


    stat.bDatDir = 1
    var accdir = this.get_usr_dat_dir()
    if (!fs.existsSync(accdir)) {
        stat.bDatDir = 0
    }

    stat.bGitDir = 1
    var git_config_fname = this.get_usr_git_dir("/.git/config")
    if (!fs.existsSync(git_config_fname)) {
        stat.bGitDir = 0
        stat.bEditable = 0
        stat.bRepositable = 0
        return stat;
    }

    stat.config = this.load_git_config()

    /////// git status
    stat.bEditable = stat.bGitDir * stat.bMyojDir * stat.bDatDir
    this.m_inp.out.state.bRepositable = 0
    if (this.m_inp.usr.passcode.length > 0) {
        //if clone with password ok, it would ok for pull/push 
        stat.bRepositable = 1
    }

    var accdir = this.get_usr_acct_dir()
    var fstat = {}
    BibleUti.GetFilesAryFromDir(accdir, true, function (fname) {
        var ret = path.parse(fname);
        var ext = ret.ext
        //console.log("ret:",ret)
        var sta = fs.statSync(fname)
        fstat[fname] = sta.size

    });

    stat.fstat = fstat

    if (cbf) cbf()
    return stat
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
BibleObjGituser.prototype.chmod_R_777_acct = async function () {
    // mode : "777" 
    var inp = this.m_inp
    var proj = inp.usr.proj;
    if (!proj) {
        inp.out.desc += ", failed inp.usr parse"
        console.log("failed git setup", inp.out.desc)
        return inp
    }
    var dir = this.get_usr_acct_dir()
    console.log("perm:", dir)
    if (!fs.existsSync(dir)) {
        return inp
    }
    var password = "lll"
    var change_perm_cmd = `echo ${password} | sudo -S chmod -R 777 ${dir}`

    inp.out.change_perm = await BibleUti.exec_Cmd(change_perm_cmd)

    return inp.out.change_perm
}
BibleObjGituser.prototype.chmod_R_ = async function (mode, dir) {
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

    inp.out.change_perm = await BibleUti.exec_Cmd(change_perm_cmd)

    return inp.out.change_perm
}

BibleObjGituser.prototype.load_git_config = function () {
    var git_config_fname = this.get_usr_git_dir("/.git/config")
    //if (!this.m_git_config_old || !this.m_git_config_new) {
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

        console.log("initial git_config_fname not normal:", txt)
    }
    if ((ipos1 * ipos2) < 0) {
        this.m_git_config_old = olds
        this.m_git_config_new = news

        //var txt = fs.readFileSync(git_config_fname, "utf8")
        var pos0 = txt.indexOf("[remote \"origin\"]")
        var pos1 = txt.indexOf("\n\tfetch = +refs");//("[branch \"master\"]")
        this.m_inp.out.state.config = txt.substring(pos0 + 19, pos1)
    }
    //}
    return this.m_inp.out.state.config
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



    if (!this.m_git_config_old || !this.m_git_config_new) {
        this.load_git_config()
    }

    if (bAllowPush) {
        fs.writeFileSync(git_config_fname, this.m_git_config_new, "utf8")
        console.log("bAllowPush=1:url =", this.m_inp.usr.proj.git_Usr_Pwd_Url)
    } else {
        fs.writeFileSync(git_config_fname, this.m_git_config_old, "utf8")
        console.log("bAllowPush=0:url =", this.m_inp.usr.repopath)
    }
}

BibleObjGituser.prototype.git_clone = async function () {
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
        inp.out.git_clone_res.desc += "|already done."
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


    inp.out.git_clone_res.git_clone_cmd = git_clone_cmd
    await BibleUti.exec_Cmd(git_clone_cmd).then(
        function (val) {
            console.log("git-clone success:", val)
            inp.out.git_clone_res.desc += ", clone success."
            inp.out.git_clone_res.success = val
            //this.git_config_allow_push(true)
            if (inp.usr.passcode.length > 0) {
                //if clone with password ok, it would ok for pull/push 
                inp.out.state.bRepositable = 1
            }
        },
        function (val) {
            console.log("git-clone failure:", val)
            inp.out.git_clone_res.desc += ", clone success."
            inp.out.git_clone_res.failure = val
        })
    return inp
}
BibleObjGituser.prototype.git_status = async function (_sb) {
    var inp = this.m_inp
    if (!inp.out.state) return console.log("*** Fatal Error: inp.out.state = null")

    if (undefined === _sb) _sb = ""
    var gitdir = this.get_usr_git_dir("/.git/config")
    if (fs.existsSync(gitdir)) {
        /////// git status
        var git_status_cmd = `
        cd ${this.get_usr_git_dir()}
        git status ${_sb}
        #git diff --ignore-space-at-eol -b -w --ignore-blank-lines --color-words=.`
        inp.out.git_status_res = {}
        await BibleUti.exec_Cmd(git_status_cmd).then(
            function (val) {
                inp.out.git_status_res.success = val
            },
            function (val) {
                inp.out.git_status_res.failure = val
            }
        )
    }
}

BibleObjGituser.prototype.git_add_commit_push_Sync = function (msg) {
    var _THIS = this
    var inp = this.m_inp
    var gitdir = this.get_usr_git_dir()
    if (!fs.existsSync(gitdir)) {
        return console.log("gitdir not exists.");
    }

    password = "lll" //dev mac
    var command = `
    #!/bin/bash
    set -x #echo on
    echo '=>cd ${gitdir}'
    cd  ${gitdir}
    echo '=>git status'
    echo ${password} | sudo -S git status
    echo '=>git diff'
    echo ${password} | sudo -S git diff --ignore-space-at-eol -b -w --ignore-blank-lines --color-words=.
    echo '=>git add *'
    echo ${password} | sudo -S git add *
    echo '=>git commit'
    echo ${password} | sudo -S git commit -m "Sync:${msg}. repodesc:${inp.usr.repodesc}"
    echo '=>git push'
    echo ${password} | sudo -S GIT_TERMINAL_PROMPT=0 git push
    echo '=>git status'
    echo ${password} | sudo -S git status
    echo '=>git status -sb'
    echo ${password} | sudo -S git status -sb
    `
    console.log('exec_command:', command)
    console.log('exec_command start:')

    try {
        //e.g. command = "ls"
        _THIS.git_config_allow_push(true)
        exec(command, (err, stdout, stderr) => {
            console.log('\n-exec_Cmd errorr:')
            console.log(err)
            console.log('\n-exec_Cmd stderr:',)
            console.log(stderr)
            console.log('\n-exec_Cmd stdout:')
            console.log(stdout)
            console.log('\n-exec_Cmd end.')
            _THIS.git_config_allow_push(false)
        });
    } catch (err) {
        console.log(err)
    }

    console.log('exec_command END.')
    setTimeout(function () {
        console.log('exec_command ENDED Mark.', gitdir)
    }, 10000)
}

BibleObjGituser.prototype.git_pull = async function (cbf) {
    this.git_config_allow_push(true)
    this.m_inp.out.git_pull_res = await this.exec_cmd_git("GIT_TERMINAL_PROMPT=0 git pull")
    this.git_config_allow_push(false)
    //var mat = this.m_inp.out.git_pull_res.stderr.match(/(fatal)|(fail)|(error)/g)
    return this.m_inp.out.git_pull_res
}

BibleObjGituser.prototype.git_push = async function () {
    this.git_config_allow_push(true)
    this.m_inp.out.git_push_res = await this.exec_cmd_git("GIT_TERMINAL_PROMPT=0 git push")
    this.git_config_allow_push(false)
    return this.m_inp.out.git_push_res
}

BibleObjGituser.prototype.cmd_exec = async function () {
    var _THIS = this
    var inp = this.m_inp

    if (!inp.par) {
        inp.out.desc = "no par"
        return
    }

    console.log("inp.par.cmdline: ", inp.par.cmdline)
    if (!inp.par.cmdline) {
        inp.out.desc = "no inp.par.cmdline"
        return
    }

    var res = await this.exec_cmd_git(inp.par.cmdline)

    return res
}
BibleObjGituser.prototype.exec_cmd_git = async function (gitcmd) {
    var _THIS = this
    var inp = this.m_inp

    //if (!inp.par) {
    //    inp.out.desc = "no par"
    //    return null
    //}

    //console.log("inp.par.cmdline: ", inp.par.cmdline)
    //if (!inp.par.cmdline) {
    //    inp.out.desc = "no inp.par.cmdline"
    //    return null
    //}

    if (!fs.existsSync(this.get_usr_git_dir())) {
        inp.out.desc = "no git dir"
        return null
    }


    //console.log("proj", proj)
    var password = "lll" //dev mac
    var scmd = `
    #!/bin/sh
    cd ${this.get_usr_git_dir()}
    echo ${password} | sudo -S ${gitcmd}
    `
    console.log("\n----git_cmd start:>", scmd)
    var res = await BibleUti.exec_Cmd(scmd)
    console.log("\n----git_cmd end.")

    return res
}




module.exports = {
    BibleUti: BibleUti,
    BibleObjGituser: BibleObjGituser
}

