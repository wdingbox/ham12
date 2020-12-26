

const fs = require('fs');
const path = require('path');
var url = require('url');
const fsPromises = require("fs").promises;

//var Uti = require("./Uti.module").Uti;
//var SvcUti = require("./SvcUti.module").SvcUti;
const exec = require('child_process').exec;



var BibleUti = {
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






    GetApiInputParamObj: function (req) {
        console.log("req.url=", req.url);
        var q = url.parse(req.url, true).query;
        console.log("q=", q);
        if (q.inp === undefined) {
            console.log("q.inp undefined. Maybe unload or api err");
            return q;
        }
        var s = decodeURIComponent(q.inp);//must for client's encodeURIComponent
        var inpObj = JSON.parse(s);
        console.log("inp=", JSON.stringify(inpObj, null, 4));
        inpObj.out = { desc: "", data: null }
        return inpObj;
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
        return  out
    },
    //// BibleUti /////
}









var BibleObjGituser = function () {

}
BibleObjGituser.prototype.set_rootDir = function (rootDir) {
    this.m_rootDir = rootDir
}

BibleObjGituser.prototype.git_proj_parse = function (inp) {
    this.m_inp = inp

    if ("object" !== typeof inp.usr) {
        inp.out.desc = "failed inp.usr "
        return null
    }
    function _parse_proj_url(proj_url) {
        //https://github.com/wdingbox/Bible_obj_weid.git
        var reg = new RegExp(/^https\:\/\/github\.com\/(\w+)\/(\w+)(\.git)$/)

        var mat = proj_url.match(reg)
        //console.log("mat", mat)
        if (mat) {
            //console.log(mat)
            var username = mat[1]
            var projname = mat[2]
            return { username: username, projname: projname }
        }
        inp.out.desc = "failed parse url:" + proj_url
        return null
    }
    var proj_url = inp.usr.repository
    var passcode = inp.usr.passcode

    inp.usr.proj = _parse_proj_url(proj_url)
    if (inp.usr.proj) {
        const baseDir = "bible_study_notes/usrs"
        var gitDir = `${baseDir}/${inp.usr.proj.username}/${inp.usr.proj.projname}`
        var rw_Dir = `${gitDir}/account`
        var tarDir = `${rw_Dir}/myoj`

        inp.usr.proj.baseDir = baseDir
        inp.usr.proj.git_dir = `${gitDir}`
        inp.usr.proj.acct_dir = `${rw_Dir}`
        inp.usr.proj.dest_myoj = `${tarDir}`

        inp.usr.proj.git_Usr_Pwd_Url = ""
        if (inp.usr.passcode.trim().length > 0) {
            inp.usr.proj.git_Usr_Pwd_Url = `https://${inp.usr.proj.username}:${inp.usr.passcode}@github.com/${inp.usr.proj.username}/${inp.usr.proj.projname}.git`
        }
        console.log("inp.usr.proj=", inp.usr.proj)
    }

    return inp.usr.proj
}
BibleObjGituser.prototype.get_usr_acct_dir = function (res) {
    if (!this.m_inp.usr.proj) return ""
    return `${this.m_rootDir}${this.m_inp.usr.proj.acct_dir}`
}
BibleObjGituser.prototype.get_usr_myoj_dir = function (res) {
    if (!this.m_inp.usr.proj) return ""
    return `${this.m_rootDir}${this.m_inp.usr.proj.dest_myoj}`
}

BibleObjGituser.prototype.get_usr_git_dir = function (subpath) {
    if (!this.m_inp.usr.proj) return ""
    if (undefined === subpath || null === subpath) {
        return `${this.m_rootDir}${this.m_inp.usr.proj.git_dir}`
    }
    return `${this.m_rootDir}${this.m_inp.usr.proj.git_dir}${subpath}`
}
BibleObjGituser.prototype.get_jsfname = function (RevCode) {
    var inp = this.m_inp
    //var RevCode = inp.par.fnames[0]
    var dest_pfname = ""
    if ("_" === RevCode[0]) {
        RevCode = RevCode.substr(1)
        if (inp.usr.proj) {
            dest_pfname = `${this.get_usr_myoj_dir()}/${RevCode}_json.js`
        }
    } else {
        dest_pfname = `${this.m_rootDir}bible_obj_lib/jsdb/jsBibleObj/${RevCode}.json.js`;
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
echo ${password} | sudo -S rm -rf ${proj.git_dir}
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
        clone_https = inp.usr.repository
    }
    if (clone_https.length === 0) {
        inp.out.git_clone_res.desc += ",no url."
        return inp
    }

    //console.log("proj", proj)
    var password = "lll" //dev mac
    var git_clone_cmd = `
#!/bin/sh
cd ${this.m_rootDir}
echo ${password} | sudo -S GIT_TERMINAL_PROMPT=0 git clone  ${clone_https}  ${proj.git_dir}
echo ${password} | sudo -S chmod  777 ${proj.git_dir}/.git/config
echo " git_clone_cmd end."
#cd -`

    //inp.out.git_clone_res.desc += ",clone git dir: " + proj.git_dir
    function _update_inp_out_git_clone_res(msg) {
        var res = _THIS.m_inp.out.git_clone_res
        res.msg = msg
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
            console.log("success:", val)
            inp.out.git_clone_res.desc += ", clone success."
            _update_inp_out_git_clone_res(val)
            //this.git_config_allow_push(true)
        }, function (val) {
            inp.out.git_clone_res.desc += ", clone success."
            console.log("failure:", val)
            _update_inp_out_git_clone_res(val)
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
echo ${password} | sudo -S cp -aR  ${this.m_rootDir}bible_obj_lib/jsdb/UsrDataTemplate/myoj  ${acctDir}
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
BibleObjGituser.prototype.change_perm_cmd = async function (dir) {
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
    var change_perm_cmd = `echo ${password} | sudo -S chmod -R 777 ${dir}`
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
BibleObjGituser.prototype.git_proj_setup = async function (res) {
    var inp = this.m_inp
    var proj = inp.usr.proj;
    if (!proj) {
        inp.out.desc += ", failed inp.usr parse"
        console.log("failed git setup", inp.out.desc)
        return inp
    }
    inp.out.desc = "setup start."
    await this.git_clone()
    var gitdir = this.get_usr_git_dir("/.git")
    if (!fs.existsSync(gitdir)) {
        inp.out.git_clone_res.bExist = false
        return inp
    }
    if (!inp.out.git_clone_res.bExist) return inp

    await this.cp_template_to_git()

    var accdir = this.get_usr_acct_dir()
    await this.change_perm_cmd(accdir)
    return inp
}
BibleObjGituser.prototype.git_proj_status = function () {
    var inp = this.m_inp
    inp.out.state = { bGitDir: 0, bMyojDir: 0, bOk: 0 }
    var gitdir = this.get_usr_git_dir("/.git/config")
    if (fs.existsSync(gitdir)) {
        inp.out.state.bGitDir = 1
        var txt = fs.readFileSync(gitdir, "utf8")
        var pos0 = txt.indexOf("[remote \"origin\"]")
        var pos1 = txt.indexOf("[branch \"master\"]")
        inp.out.state.config = txt.substring(pos0, pos1)
    }

    var accdir = this.get_usr_myoj_dir()
    if (fs.existsSync(accdir)) {
        inp.out.state.bMyojDir = 1
    }
    inp.out.state.bOk = inp.out.state.bGitDir * inp.out.state.bMyojDir
    return inp
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

    if (!this.m_inp.usr.proj) return
    var git_config_fname = this.get_usr_git_dir("/.git/config")
    if (!fs.existsSync(git_config_fname)) {
        console.log(".git/config not exist:", git_config_fname)
        return
    }

    var txt = fs.readFileSync(git_config_fname, "utf8")
    console.log("bAllowPush", bAllowPush)
    console.log("before:", txt)
    console.log("old:", this.m_inp.usr.repository)
    console.log("new:", this.m_inp.usr.proj.git_Usr_Pwd_Url)

    var bNeedWrite = false
    if (bAllowPush) {
        var ipos = txt.indexOf(this.m_inp.usr.proj.git_Usr_Pwd_Url)
        if (ipos > 0) {
            txt = txt.replace(this.m_inp.usr.repository, this.m_inp.usr.proj.git_Usr_Pwd_Url)
            bNeedWrite = true
        }
    } else {
        var ipos = txt.indexOf(this.m_inp.usr.proj.repository)
        if (ipos > 0) {
            txt = txt.replace(this.m_inp.usr.proj.git_Usr_Pwd_Url, this.m_inp.usr.repository)
            bNeedWrite = true
        }
    }
    console.log("after:", txt)

    if (bNeedWrite) {
        fs.writeFileSync(git_config_fname, txt, "utf8")
    }
}
BibleObjGituser.prototype.git_add_commit_push = function (desc) {

    password = "lll" //dev mac
    var cmd_commit = `
cd  ${this.get_usr_git_dir()}
echo ${password} | sudo -S git status
echo ${password} | sudo -S git pull
echo ${password} | sudo -S git diff --ignore-space-at-eol -b -w --ignore-blank-lines --color-words=.
echo ${password} | sudo -S git add *
echo ${password} | sudo -S git commit -m "svr update ${desc}"
echo ${password} | sudo -S GIT_TERMINAL_PROMPT=0 git push
echo ${password} | sudo -S git status
cd -
`
    var _THIS = this
    this.git_config_allow_push(true)
    BibleUti.exec_Cmd(cmd_commit).then(
        function (val) {
            console.log("success:", val)
            _THIS.git_config_allow_push(false)
        },
        function (val) {
            console.log("failure:", val)
            _THIS.git_config_allow_push(false)
        }
    )
}
BibleObjGituser.prototype.git_pull = function () {
    password = "lll" //dev mac
    var cmd_git_pull = `
#!/bin/sh
cd  ${this.get_usr_git_dir()}
echo ${password} | sudo -S git status
echo ${password} | sudo -S git pull
echo ${password} | sudo -S git status
cd -
`
    var _THIS = this
    this.git_config_allow_push(true)
    BibleUti.exec_Cmd(cmd_git_pull).then(
        function (val) {
            console.log("success:", val)
            _THIS.git_config_allow_push(false)
        },
        function (val) {
            console.log("failure:", val)
            _THIS.git_config_allow_push(false)
        }
    )
}






module.exports = {
    BibleUti: BibleUti,
    BibleObjGituser: BibleObjGituser
}
