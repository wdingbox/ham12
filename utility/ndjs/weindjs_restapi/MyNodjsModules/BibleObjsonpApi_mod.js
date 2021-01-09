

const fs = require('fs');
const path = require('path');
const { nextTick } = require('process');
var url = require('url');
const fsPromises = require("fs").promises;

//var Uti = require("./Uti.module").Uti;
//var SvcUti = require("./SvcUti.module").SvcUti;
//const exec = require('child_process').exec;

const { BibleObjGituser, BibleUti } = require("./BibleObjGituser_mod")






var inp_struct_base = {
    usr: {
        repopath: "",
        passcode: "",
        repodesc: ""
    },
    par: {
        fnames: [],
        bibOj: { bkc: { chp: { vrs: "" } } }
    }
}
var inp_struct_search = JSON.parse(JSON.stringify(inp_struct_base))
inp_struct_search.par.Search = { File: "", Strn: "" }
var inp_struct_account_setup = JSON.parse(JSON.stringify(inp_struct_base))
inp_struct_account_setup.par = null
var inp_struct_all = JSON.parse(JSON.stringify(inp_struct_base))
inp_struct_all.par.Search = inp_struct_search.par.Search

var ApiJsonp_BibleObj = {
    Jsonpster: function (req, res) {
        if (!req || !res) {
            return {}
        }
        ////////////////////////////////////////////
        //app.get("/Jsonpster", (req, res) => {
        console.log();
        console.log("res.req.headers.host=", res.req.headers.host);

        //////////////
        var RestApi = {}
        Object.keys(this).forEach(function (key) {
            RestApi[key] = { str: key };//, inp: ApiJsonp_BibleObj[key]() };
        })
        var jstr_RestApi = JSON.stringify(RestApi);
        var structall = JSON.stringify(inp_struct_all)


        var s = `
var Jsonpster = {
    host: "${res.req.headers.host}",
    url: "http://${res.req.headers.host}/",
    api: "",
    inp: ${structall},
encrypt_usr: function(){
    if(!this.inp.usr.passcode_encrypted){
        //this.inp.usr.passcode_encrypted = 1;
        //this.inp.usr.passcode_old = this.inp.usr.passcode
        //this.inp.usr.passcode = atob(this.inp.usr.passcode)
    }else{
        alert("alredy encrypted???")
    }
},
Url: function (){
    this.m_src = this.url + this.api + '?inp=' + encodeURIComponent(JSON.stringify(this.inp));
    return this.m_src;
},
Run : function (cbf) {
    this.encrypt_usr()
    this.RunJsonP(cbf)
},
RunJsonP : function (cbf) {
    if (!cbf) alert('callback Response null');
    if (!this.api) alert('api=null');
    if (!this.inp) alert('inp=null');
    this.Response = cbf;
    var s = document.createElement('script');
    s.src = this.Url()
    document.body.appendChild(s);
    console.log('Jsonpster:', Jsonpster);
    this.api = this.inp.par = null;
},
xxRunPost : function (cbf) {
    if(!cbf) return alert("cbf null.")
    var surl = "http://${res.req.headers.host}/" + this.api
    $.post(surl,
        this.inp,
        function(data, status){
            if(cbf) cbf(data, status)
            console.log("Data: " + data + ",Status: " + status);
        }
    )
},
xxRunPosts : function (cbf) {
    if(!cbf) return alert("cbf null.")
    var surl = "https://${res.req.headers.host}/"
    surl = surl.replace("7778", "7775") + this.api
    $.post(surl,
        this.inp,
        function(data, status){
            if(cbf) cbf(data, status)
            console.log("Data: " + data + ",Status: " + status);
        }
    )
},
xxRun_Post : function (cbf) {
    if(!cbf) return alert("cbf null.")
    var surl = "http://${res.req.headers.host}/" + this.api
    $.post(surl,
        this.inp
    ).done(function(ret){
        if(cbf) cbf(data, status)
    })
},
RunAjaxPost : function(cbf){
    this.encrypt_usr()
    this.RunAjax_Type_Post (cbf)
},
RunAjax_Type_Post : function(cbf){
    var surl = "http://${res.req.headers.host}/" + this.api
    $.ajax({
        type: "POST",
        dataType: 'text',
        contentType: "application/json; charset=utf-8",
        url: surl,
        data: JSON.stringify(this.inp),
        username: 'user',
        password: 'pass',
        crossDomain : true,
        xhrFields: {
            withCredentials: false
        }
    })
        .success(function( data ) {
            //console.log("success",data);
            //cbf(JSON.parse(data))
        })
        .done(function( data ) {
            //console.log("done",data);
            cbf(JSON.parse(data))
        })
        .fail( function(xhr, textStatus, errorThrown) {
            console.log("surl",surl)
            alert("xhr.responseText="+xhr.responseText);
            alert("textStatus="+textStatus);
        });
}
};
const RestApi = JSON.parse('${jstr_RestApi}');
`;;;;;;;;;;;;;;

        console.log(s);
        res.send(s);
        res.end();
        //});
    },
    ApiBibleObj_load_by_bibOj: function (req, res) {
        if (!req || !res) {
            return inp_struct_base
        }
        var userProject = new BibleObjGituser(BibleObjJsonpApi.m_rootDir)

        var inp = BibleUti.Parse_req_GET_to_inp(req)
        var proj = userProject.git_proj_parse(inp)
        var RbcObj = {};
        if (proj && "object" === typeof inp.par.fnames && inp.par.bibOj) {//['NIV','ESV']
            for (var i = 0; i < inp.par.fnames.length; i++) {
                var trn = inp.par.fnames[i];
                var jsfname = userProject.get_pfxname(trn)
                console.log("load:", jsfname)
                var bib = BibleUti.load_BibleObj_by_fname(jsfname);
                if (!bib.obj) {
                    inp.out.desc += ":noexist:" + trn
                    console.log("not exist..............", jsfname)
                    continue
                }
                var bcObj = BibleUti.fetch_bcv(bib.obj, inp.par.bibOj);
                RbcObj[trn] = bcObj;
                inp.out.desc += ":" + trn
            }
            inp.out.desc += ":success"
        }
        var bcvR = {}
        BibleUti.convert_rbcv_2_bcvR(RbcObj, bcvR)
        inp.out.data = bcvR
        console.log(inp.out)

        var sret = JSON.stringify(inp);
        //console.log("sert:", sret)
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.write("Jsonpster.Response(" + sret + ");");
        res.end();
    },

    ApiBibleObj_search_txt: function (req, res) {
        if (!req || !res) {
            return inp_struct_search
        }
        var userProject = new BibleObjGituser(BibleObjJsonpApi.m_rootDir)
        var inp = BibleUti.Parse_req_GET_to_inp(req)
        if (!inp.usr.f_path) inp.usr.f_path = ""
        var proj = userProject.git_proj_parse(inp)

        var RbcObj = {};
        if (proj && "object" === typeof inp.par.fnames) {//['NIV','ESV']
            for (var i = 0; i < inp.par.fnames.length; i++) {
                var trn = inp.par.fnames[i];
                var jsfname = userProject.get_pfxname(trn)
                var bib = BibleUti.load_BibleObj_by_fname(jsfname);
                var bcObj = BibleUti.fetch_bcv(bib.obj, inp.par.bibOj);
                RbcObj[trn] = bcObj;
                inp.out.desc += ":" + trn
            }
        }
        var bcvR = {}
        BibleUti.convert_rbcv_2_bcvR(RbcObj, bcvR)
        inp.out.data = BibleUti.search_str_in_bcvR(bcvR, inp.par.Search.File, inp.par.Search.Strn);

        inp.out.desc += ":success."
        var ss = JSON.stringify(inp);

        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.write("Jsonpster.Response(" + ss + ");");
        res.end();
    },
    ApiBibleObj_write_Usr_BkcChpVrs_txt_asyn: async function (req, res) {
        if (!req || !res) {
            return inp_struct_search
        }
    },
    ApiBibleObj_write_Usr_BkcChpVrs_txt: async function (req, res) {
        if (!req || !res) {
            return inp_struct_base
        }
        BibleUti.Parse_post_req_to_inp(req, res, async function (inp) {
            //: unlimited write size. 
            var save_res = { desc: "to save" }
            var userProject = new BibleObjGituser(BibleObjJsonpApi.m_rootDir)
            var proj = userProject.git_proj_parse(inp)
            if (!proj) {
                save_res.desc = "proj=null"
                return
            }

            //if ("object" === typeof inp.par.fnames) {//['NIV','ESV']
            var doc = inp.par.fnames[0]
            var jsfname = userProject.get_pfxname(doc)
            var bio = BibleUti.load_BibleObj_by_fname(jsfname);
            if (!bio.obj) {
                save_res.desc = `load(${doc},${jsfname})=null`
                return;
            }

            var karyObj = BibleUti.inpObj_to_karyObj(inp.par.inpObj)
            if (karyObj.kary.length !== 4) {
                save_res.desc = `err inpObj: ${JSON.stringify(karyObj)}`
                return
            }
            console.log(karyObj)
            bio.obj[karyObj.bkc][karyObj.chp][karyObj.vrs] = karyObj.txt
            bio.writeback()

            //// inp.out = BibleUti.Write2vrs_txt_by_inpObj(jsfname, doc, inp.par.inpObj, true)
            var save_res = {}
            save_res.saved_size = karyObj.txt.length
            //save_res.ret = bio
            save_res.desc = `${doc}~${karyObj.bkc}${karyObj.chp}:${karyObj.vrs} save-ok.`
            inp.out.save_res = save_res

            await userProject.git_add_commit_push(save_res.desc)
        })

        //res.writeHead(200, { 'Content-Type': 'text/javascript' });
        //res.write("Jsonpster.Response(" + ss + ");");
        //res.end();
    },
    ApiBibleObj_read_Usr_BkcChpVrs_txt: async function (req, res) {
        if (!req || !res) {
            return inp_struct_base
        }
        var inp = BibleUti.Parse_req_GET_to_inp(req)
        var userProject = new BibleObjGituser(BibleObjJsonpApi.m_rootDir)
        var proj = userProject.git_proj_parse(inp)
        var doc = inp.par.fnames[0]
        var jsfname = userProject.get_pfxname(doc)
        var bio = BibleUti.load_BibleObj_by_fname(jsfname);
        var karyObj = BibleUti.inpObj_to_karyObj(inp.par.inpObj)
        if (karyObj.kary.length < 3) {
            inp.out.desc = `err inpObj: ${JSON.stringify(karyObj)}`
        }
        if (proj && bio.obj && karyObj.kary.length >= 3) {
            await userProject.git_pull(function (bSuccess) {
            })
            inp.out.desc = "load success"
            inp.out.data = bio.obj[karyObj.bkc][karyObj.chp][karyObj.vrs]
        } else {
            inp.out.desc = "failed git pull and load"
        }

        //inp.out = BibleUti.Write2vrs_txt_by_inpObj(jsfname, doc, inp.par.inpObj, false)

        var ss = JSON.stringify(inp)
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.write("Jsonpster.Response(" + ss + ");");
        res.end();
    },

    ///////////////////////////////////
    ApiUsrDat_save: async function (req, res) {
        if (!req || !res) {
            return inp_struct_base
        }
        BibleUti.Parse_post_req_to_inp(req, res, async function (inp) {
            //: unlimited write size. 
            var userProject = new BibleObjGituser(BibleObjJsonpApi.m_rootDir)
            var proj = userProject.git_proj_parse(inp)
            if (!proj) return
            var result = await userProject.git_proj_setup()
            if (!result) return


            //if ("object" === typeof inp.par.fnames) {//['NIV','ESV']
            var doc = inp.par.fnames[0]
            var jsfname = userProject.get_pfxname(doc)
            var ret = BibleUti.load_BibleObj_by_fname(jsfname)
            if (!ret.obj) return
            ret.obj = JSON.parse(inp.par.data, null, 4)
            console.log("ret", ret)
            ret.writeback()

            //// 
            var save_res = {}
            save_res.saved_size = inp.par.data.length
            save_res.ret = ret
            inp.out.save_res = save_res
            var msg = jsfname + " saved."

            await userProject.git_add_commit_push(msg)
        })
    },
    ApiUsrDat_load: async function (req, res) {
        if (!req || !res) {
            return inp_struct_base
        }
        var inp = BibleUti.Parse_req_GET_to_inp(req)
        var userProject = new BibleObjGituser(BibleObjJsonpApi.m_rootDir)
        var proj = userProject.git_proj_parse(inp)
        if (proj) {

            await userProject.git_proj_setup()

            var retp = userProject.git_proj_status()
            if (retp) {
                await userProject.git_pull(function (bSuccess) {

                })
                await userProject.git_push()
            }

            //inp = BibleUti.Write2vrs_txt(inp, false)
            var doc = inp.par.fnames[0]
            var jsfname = userProject.get_pfxname(doc)
            var ret = BibleUti.load_BibleObj_by_fname(jsfname)
            inp.out.data = ret.obj
            if (!inp.out.state) inp.out.state.bEditable = 1
        }

        var ss = JSON.stringify(inp)
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.write("Jsonpster.Response(" + ss + ");");
        res.end();
    },







    ///////////////////////////////////

    ApiUsrReposData_create_async: function (req, res) {
        if (!req || !res) {
            return inp_struct_account_setup
        }
    },
    ApiUsrReposData_create: async function (req, res) {
        console.log("ApiUsrReposData_create")
        if (!req || !res) {
            return inp_struct_account_setup
        }
        var inp = BibleUti.Parse_req_GET_to_inp(req)
        var userProject = new BibleObjGituser(BibleObjJsonpApi.m_rootDir)
        var ret = userProject.git_proj_parse(inp)
        if (ret) {
            await userProject.git_proj_setup()
        }

        var sret = JSON.stringify(inp, null, 4)

        console.log("oup is ", inp.out)
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.write("Jsonpster.Response(" + sret + ");");
        res.end();
    },
    ApiUsrReposData_destroy_async: function (req, res) {
        if (!req || !res) {
            return inp_struct_account_setup
        }
    },
    ApiUsrReposData_destroy: async function (req, res) {
        if (!req || !res) {
            return inp_struct_account_setup
        }
        var inp = BibleUti.Parse_req_GET_to_inp(req)

        var userProject = new BibleObjGituser(BibleObjJsonpApi.m_rootDir)
        if (userProject.git_proj_parse(inp)) {
            await userProject.git_proj_destroy(res)
        }

        var sret = JSON.stringify(inp, null, 4)

        console.log("oup is ", inp.out)
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.write("Jsonpster.Response(" + sret + ");");
        res.end();
    },
    ApiUsrReposData_status_async: function (req, res) {
        if (!req || !res) {
            return inp_struct_account_setup
        }
    },
    ApiUsrReposData_status: async function (req, res) {
        if (!req || !res) {
            return inp_struct_account_setup
        }
        var inp = BibleUti.Parse_req_GET_to_inp(req)

        var userProject = new BibleObjGituser(BibleObjJsonpApi.m_rootDir)
        if (userProject.git_proj_parse(inp)) {
            var ret = userProject.git_proj_status(async function () {
            })
            if (ret) {
                await userProject.git_push()
            }
        }

        var sret = JSON.stringify(inp, null, 4)

        console.log("oup is ", inp.out)
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.write("Jsonpster.Response(" + sret + ");");
        res.end();
    },

    ApiUsrReposData_git_push_async: function (req, res) {
        if (!req || !res) {
            return inp_struct_account_setup
        }
    },
    ApiUsrReposData_git_push: async function (req, res) {
        if (!req || !res) {
            return inp_struct_account_setup
        }
        var inp = BibleUti.Parse_req_GET_to_inp(req)

        var userProject = new BibleObjGituser(BibleObjJsonpApi.m_rootDir)
        if (userProject.git_proj_parse(inp)) {
            await userProject.git_proj_setup()
            await userProject.git_add_commit_push("push all changes.")
        }

        var sret = JSON.stringify(inp, null, 4)

        console.log("oup is ", inp.out)
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.write("Jsonpster.Response(" + sret + ");");
        res.end();
    },

    ApiUsr_Cmdline_Exec: async function (req, res) {
        if (!req || !res) {
            return inp_struct_account_setup
        }
        var inp = BibleUti.Parse_req_GET_to_inp(req)
        var userProject = new BibleObjGituser(BibleObjJsonpApi.m_rootDir)
        if (userProject.git_proj_parse(inp)) {

            var cmds = inp.par.data
            inp.out.Cmdline_Exec = {}
            await BibleUti.exec_Cmd(cmds).then(
                function (val) {
                    console.log("Cmdline_Exec success:", val)
                    inp.out.Cmdline_Exec.desc = "success."
                    inp.out.Cmdline_Exec.res = val
                },
                function (val) {
                    console.log("Cmdline_Exec failure:", val)
                    inp.out.Cmdline_Exec.desc = "failure."
                    inp.out.Cmdline_Exec.res = val
                })
        }

        var sret = JSON.stringify(inp, null, 4)
        console.log("oup is ", inp.out)
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.write("Jsonpster.Response(" + sret + ");");
        res.end();
    },


}//// BibleRestApi ////

var BibleObjJsonpApi = {
    set_postHeader: function (res) {
        // for cross domain post.

        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)
        res.setHeader('Access-Control-Allow-Credentials', true);

        // Pass to next layer of middleware
    },
    init: function (app, rootDir) {
        BibleObjJsonpApi.m_rootDir = rootDir
        //
        Object.keys(ApiJsonp_BibleObj).forEach(function (sapi) {
            console.log("api:", sapi)
            app.use("/" + sapi, function (req, res) {
                BibleObjJsonpApi.set_postHeader(res)

                ApiJsonp_BibleObj[sapi](req, res);
            })
        });
        return;
    }
}




module.exports = {
    BibleObjJsonpApi: BibleObjJsonpApi
}

