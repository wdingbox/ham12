














    var BibleInputMenu = function () {
    }
    BibleInputMenu.prototype.init = function () {

        $("body").prepend(BibleInputMenuContainer);

        this.Gen_Keys_Menu();
        this.Gen_BKN_Table("#Tab_bkn tbody", CNST.FnameOfBibleObj);
        this.Gen_Cat_Table();
        this.Gen_Digit_Table("#Tab_chp tbody", "chp_num", 150);
        this.Gen_Digit_Table("#Tab_vrs tbody", "vrs_num", 176);

        var _This = this;



        $("#Compare_vcv").click(function () {
            $("#oBible table").find("tr").each(function () {
                var len = $(this).find("td:eq(2)").find("[type=checkbox]").length;
                $(this).find("td:eq(0)").text(len);
            });
            table_sort("#oBible table");
        });
        $("#oBible_indxer").click(function () {
            table_col_index("#oBible table");
            table_sort("#oBible table");
        });



        $("#vol_capx").click(function () {
            var m = $("#Tab_vol tbody").find(".v3.hili").length;
            if (m > 0) {
                $("#Tab_vol tbody").find(".v3").removeClass("hili");
            } else {
                $("#Tab_vol tbody").find(".v3").addClass("hili");
            }
            var m = $("#Tab_vol tbody").find(".v3.hili").length;
            $("#vol_cap_sub").text(m);
        });




        $("#blb").click(function () {
            var vid = $(".vid.hili").text();
            var ret = Uti.vcv_parser(vid);
            var url = $(this).attr("ref");
            if (!ret) return;

            var blbvol = CNST.BlueLetterBibleCode[ret.vol];
            var file = blbvol + "/" + ret.chp + "/" + ret.vrs;
            $(this).attr("href", url + file);
        });
        $("#h_g").click(function () {
            var vid = $(".vid.hili").text();
            var ret = Uti.vcv_parser(vid);
            var url = $(this).attr("ref");
            if (!ret) return;

            var volm = ret._vol;
            var bkidx = CNST.BookID2IdxCode[volm];
            var file = bkidx[0] + volm + "_" + ret.chp3 + ".htm#" + ret.vrs;
            $(this).attr("href", url + file);
        });
        $("#gtw").click(function () {
            var vid = $(".vid.hili").text();
            var ret = Uti.vcv_parser(vid);
            var url = $(this).attr("ref");
            if (!ret) return;

            var vol2 = CNST.BibVolName[ret.vol][0];
            var file = vol2 + ret.chp + ":" + ret.vrs + "&version=NIV;CUV;KJV;NKJV;ESV";
            $(this).attr("href", url + file);
        });
        $("#studylight").click(function () {
            var vid = $(".vid.hili").text();
            var ret = Uti.vcv_parser(vid);
            var url = $(this).attr("ref");
            if (!ret) return;

            //https://www.studylight.org/commentary/john/1-1.html
            var vol2 = CNST.BibVolName_Studylight([ret.vol]);
            var file = vol2 + "/" + ret.chp + "-" + ret.vrs + ".html";
            $(this).attr("href", url + file);
            console.log(url + file);
        });

        $("#ccel_org").click(function () {
            var vid = $(".vid.hili").text();
            var ret = Uti.vcv_parser(vid);
            var url = $(this).attr("ref");
            if (!ret) return;

            //http://www.ccel.org/study/1_Samuel%202:11-4:18 
            var bok = CNST.BibVolName_ccel([ret.vol]);
            var file = bok + " " + ret.chp + ":" + ret.vrs + ".html";
            $(this).attr("href", url + file);
            console.log(url + file);
        });

        $("#crossReference").click(function () {
            var vid = $(".vid.hili").text();
            var ret = Uti.vcv_parser(vid);
            var url = $(this).attr("ref");
            if (!ret) return;

            //http://www.ccel.org/study/1_Samuel%202:11-4:18 
            var bok = CNST.BlueLetterBibleCode[ret.vol];
            var file = bok + " " + ret.chp + ":" + ret.vrs + "";
            $(this).attr("href", url + file);
            console.log(url + file);
        });


        $("#Tab_cat caption").click(function () {
            $(".cat").removeClass("hili");
            $(".v3").remove();

        });



        $("#vrs_cap").click(function () {
            var parm = _This.get_selected_vcv_parm();
            console.log(parm)
            if (parm.vrs === "*") {
                Uti.Msg("no op");
                return;
            };
            var vcv = parm.vol_arr[0] + parm.chp + ":" + parm.vrs;
            if (Uti.scrollIntoViewIfNeeded_to_vid(vcv)) {
                var inp = { Search: { File: RestApi.HistFile.__history_verses_loaded, Strn: vcv } };
                var prm = { api: RestApi.ApiBibleObj_access_regex_search_history, inp: inp };
                Uti.Msg(prm);
                Jsonpster.Run(prm, function (ret) {
                    Uti.Msg(vcv);
                });
            } else {
                Uti.Msg(vcv + " not found.")
            }
        });
    };
    BibleInputMenu.prototype.Gen_Keys_Menu = function () {
        var ks = Uti.get_cha_arr_after_str("", _Max_struct);

        var s = "<tr id='vitr'>";
        var _This = this;
        $.each(ks, function (i, c) {
            var volarr = Uti.Get_Vol_Arr_from_KeyChar(c, _Max_struct);
            var ssb = "<sub>" + volarr.length + "</sub>";
            if (volarr.length === 1) ssb = "";
            c = c + ssb;
            s += "<th><div class='vin'>" + c + "</div></th>";
            if (9 == i) s += "</tr><tr>";
        });
        s += "</td></tr>";

        $("#Tab_BibleSingleInputKey tbody").html(s).find(".vin").bind("click", function () {
            $(".vin").removeClass("hili");
            $(this).addClass("hili");
            var ch = $(this).text();
            var volarr = Uti.Get_Vol_Arr_from_KeyChar(ch[0], _Max_struct);
            _This.Gen_Vol_Table("#Tab_vol tbody", volarr);

        });
        return ks;
    };

    BibleInputMenu.prototype.Gen_BKN_Table = function gen_BKN_Table(tid, bknObj) {
        var str = "";
        var bknArr = Object.keys(bknObj);
        $.each(bknArr, function (i, v) {
            var hil = "";
            if (i == 1) hil = "hili";
            str += "<tr><td class='cbkn " + hil + "'>" + v + "</td></tr>";
        });
        $(tid).html(str).find(".cbkn").bind("click", function () {
            //$(".cbkn").removeClass("hili");
            $(this).toggleClass("hili");

            $(".searchFile").removeClass("searchFile");
            $(this).toggleClass("searchFile");

            $("#searchFile").text($(this).text());

            var name = $(this).text();
            Uti.Msg(name + " : " + bknObj[name]);
        });
    }
    BibleInputMenu.prototype.Gen_Cat_Table = function () {
        var _This = this;
        var s = "";
        $.each(Object.keys(CNST.Cat2VolArr), function (i, v) {
            s += "<tr><td class='cat'>" + v + "</td></tr>";
        });
        $("#Tab_cat tbody").html(s).find(".cat").bind("click", function () {
            $(".cat").removeClass("hili");
            var scat = $(this).addClass("hili").text();
            if (document.m_current_cat === scat) {
                $("#vol_capx").click();
            } else {
                document.m_current_cat = scat;
                var vol_arr = CNST.Cat2VolArr[scat];
                _This.Gen_Vol_Table("#Tab_vol tbody", vol_arr);
            }

        });
    };

    BibleInputMenu.prototype.Gen_Vol_Table = function (tid, vol_arr) {
        function update_digit_cap(tid) {
            var m = $(tid).find(".v3.hili").length;
            $("#vol_cap_sub").text(m);
            if (m > 1) {
                $(".digiCap").addClass("grayout");
            } else {
                $(".digiCap").removeClass("grayout");
            }
            $(".clear").click();
        };
        var _This = this;
        var trs = Uti.Gen_Vom_trs(vol_arr);
        $("#vol_cap_sub").text("1");
        $("#BibleInputCap").text(CNST.BibVolNameEngChn(vol_arr[0]));
        $(tid).html(trs).find(".v3").bind("click", function () {
            var vol = $(this).text();
            $(this).toggleClass("hili");
            $("#BibleInputCap").text(CNST.BibVolNameEngChn(vol));

            Uti.Msg(vol+" : maxChap = "+Object.keys(_Max_struct[vol]).length);
            update_digit_cap(tid);
        });
        update_digit_cap(tid);
    };

    BibleInputMenu.prototype.Gen_Digit_Table = function (tid, clsname, imaxNum) {
        function _td(num, clsname) {
            var s = "<td><button class='digit " + clsname + "'>" + num + "</button></td>";
            return s;
        }
        function gen_trs() {
            var s = "", num = 1;
            s += "<tr>" + _td(0, clsname);
            s += "<th title='clear'><button title='clear' class='clear' >C</button></th>";
            s += "<th title='undo'><button title='clear'  class='undo' >&lt;</button></th>";
            s += "</tr>";
            for (var i = 0; i < 3; i++) {
                s += "<tr>";
                for (var k = 0; k < 3; k++) {
                    s += _td(num++, clsname);
                }
                s += "</tr>";
            };
            return s;
        };

        var s = gen_trs();
        var _This = this;
        $(tid).html(s).find("button:contains('0')").attr("disabled", true);
        $(tid).find(".digit").bind("click", function () {
            if (clsname === "chp_num") {
                onclick_chp_digi(this);
            } else {
                onclick_rse_digi(this);
            }
        });
        $(tid).find(".clear").bind("click", function () {
            var eTab = $(this).parentsUntil("table").parent();
            var cap = eTab.find(".digiCap");
            cap.text("*");
            $(tid).find(".digit").attr("disabled", null);
            //$(tid).find("button:contains('0')").attr("disabled", true);
            reset_chp_num(eTab);
            reset_rse_num(eTab);
        });
        $(tid).find(".undo").bind("click", function () {
            var eTab = $(this).parentsUntil("table").parent();
            var cap = $(this).parentsUntil("table").parent().find(".digiCap");
            var str = cap.text();
            if (str.length == 1) {
                $(tid).find(".clear").click();
                return;
            }
            else {
                str = str.substr(0, str.length - 1);
                cap.text(str);
            }
            reset_chp_num(eTab);
            reset_rse_num(eTab);
        });
        return;
    };


    BibleInputMenu.prototype.get_selected_bkn_fnamesArr = function () {
        var fnamesArr = [];
        $(".cbkn.hili").each(function () {
            var ss = $(this).text();
            fnamesArr.push(ss);
        });
        if (fnamesArr.length == 0) {
            alert("Err: no bookname selected.");
        }
        return fnamesArr;
    };///
    BibleInputMenu.prototype.get_selected_Search_Parm = function () {
        var searchFileName = $(".cbkn.hili.searchFile").text();
        var searchStrn = $("#sinput").val();
        return { File: searchFileName, Strn: searchStrn };
    };///
    BibleInputMenu.prototype.get_selected_vcv_parm = function () {
        var vol_arr = [];
        $(".v3.hili").each(function () {
            var svol = $(this).text();
            vol_arr.push(svol);
        });
        if (0 === vol_arr.length) {
            vol_arr = vol_arr.concat(CNST.OT_Vols_Ary);
            vol_arr = vol_arr.concat(CNST.NT_Vols_Ary);
            if (vol_arr.length != 66) {
                alert("fatal err concat len=" + vol_arr.length)
            };
        };
        if (0 === vol_arr.length) {
            alert("fatal err vol_arr.len=0");
        }

        var parm = {};
        parm.chp = $("#chp_cap").text();
        parm.vrs = $("#vrs_cap").text();
        parm.vol_arr = vol_arr;
        return parm;
    };
    BibleInputMenu.prototype.get_selected_xOj_Parm_____________ = function () {
        var ret = this.get_selected_vcv_parm();
        var bibOj = Uti.get_xOj(ret);
        return bibOj;
    };///
    BibleInputMenu.prototype.get_selected_load_parm = function () {
        //
        var fnamesArr = this.get_selected_bkn_fnamesArr();
        var vcvpar = this.get_selected_vcv_parm();
        var bibOj = Uti.get_xOj(vcvpar);
        var ret = { fname: fnamesArr, bibOj: bibOj, Search: null };

        return ret;
    };
    ///////////
    //////////
    //////////
    //////////
    /////////
    ///////////
    //////////
    //////////
    //////////
    /////////
    function apiCallback_Gen_clientBibleObj_table(ret) {
        function editing_save(_This) {
            var old = $(_This).attr("oldtxt");
            var fil = $(_This).attr("title");
            var txt = $(_This).text();
            var vid = $(_This).attr("vid");
            if (!fil) {
                return;
            }

            if (old === txt) {
                Uti.Msg("no changes on text.");
                $(_This).parent().append(`<a class='ok'> (NoChanges!)</a>`);
                return;
            } else {
                if (!confirm("Save changes?")) {
                    return;
                }
            }

            var mat = vid.match(/^(\w{3})(\d+)\:(\d+)$/);
            if (!mat) {//Gen1:1
                alert("edi save err:" + vid + ":" + txt);
                return;
            }
            var dat = {}
            dat.vol = mat[1];
            dat.chp = mat[2];
            dat.vrs = mat[3];
            dat.txt = txt;

            //var _This = this;
            var inp = { fname: [fil], vcvx: dat };
            var par = { api: RestApi.ApiBibleObj_update_notes, inp: inp };
            Jsonpster.Run(par, function () {
                Uti.Msg(par);
                var stx = txt.substr(0, 5) + " ... " + txt.substr(txt.length - 15);
                Uti.Msg(stx);
                $(_This).removeClass("edit_keydown").removeClass("editing");
                $(_This).parent().append(`<a class='ok'> [${stx}](Saved!)</a>`);
            });
        };


        var tb = Uti.gen_clientBibleObj_table(ret);
        Uti.Msg("tot=" + tb.size);
        $("#oBible").html(tb.htm);
        table_sort("#BibOut");
        $("#oBible").find(".vid").bind("click", function () {
            var _This = this;
            $(".vid.hili").removeClass("hili");
            $(_This).toggleClass("hili");
            var vid = $(this).text();
            var inp = { Search: { File: RestApi.HistFile.__history_verses_loaded, Strn: vid } };
            var prm = { api: RestApi.ApiBibleObj_access_regex_search_history, inp: inp };
            Jsonpster.Run(prm, function (ret) {
                Uti.Msg(vid + " is stored in history; and ref is available.");
            });
        });

        //$("#oBible").find(".tx").bind("focusout", editing_save);
        $("#oBible").find(".tx").bind("keydown", function () {
            $(this).addClass("edit_keydown");
        });
        $("#oBible").find("[type=checkbox]").bind("click", function () {
            $(".ok").remove();
            var stit = $(this).attr("title");
            if (stit[0] != "_") { //"_bnotes") {
                if ($(this).prop("checked")) {
                    if ("password123" != prompt("Only Authorized people can edit it. \nPlease enter password.", "password")) {
                        return;
                    };
                }
            }
            if ($(this).prop("checked")) {
                $(this).next().attr("contenteditable", "true").addClass("editing").attr("title", stit);
                var oldtxt = $(this).next().text();
                $(this).next().attr("oldtxt", oldtxt);
            } else {
                $(this).next().attr("contenteditable", null).removeClass("editing");
                editing_save($(this).next());
            }
        });
        $("#oBible").find(".tx").bind("click", function () {
            $(".ok").remove();
            $(this).toggleClass("hili2");
            var rsn=$(this).prev().attr("title");
            var txt = $(this).text();
            var vcv = $(this).parentsUntil("tbody").find("td:eq(0)").text();
            txt=`"${txt}" (${vcv} ${rsn})`;
            Uti.Msg(txt + " (" + vcv + ")");
            //copy to clipboard.
            if ($(this).attr("contenteditable")) {
                //nop
            } else {
                $("#CopyTextToClipboard").val(txt);
                $("#CopyTextToClipboard").select();
                document.execCommand("copy");
            }
        });
        txFontsizeIncrs(0);
    }
    function onclick_load_BknVolChpVrs() {
        var inp = gBim.get_selected_load_parm();
        //inp.Search.File = "";//disable search
        if (!Uti.validateBibleLoad(inp)) return;
        console.log(inp);

        var par = { api: RestApi.ApiBibleObj_load_Bkns_Vols_Chp_Vrs, inp: inp };

        Jsonpster.Run(par, apiCallback_Gen_clientBibleObj_table);

        console.log(Jsonpster);
    };

    function onclick_regex_match_next(incrs) {
        var str = $("#sinput").val();
        var reg = new RegExp(str, "g");

        var matSize = $(".mat").length;
        if (matSize > 0 && str === document.g_matchStrin) {
            if (Math.abs(document.g_matchIndex) >= matSize) {
                document.g_matchIndex = 0;
            }
            var elm = ".mat:eq(" + document.g_matchIndex + ")";
            //$(elm).parentsUntil("tr").addClass ("hili");
            $(".mat.matIndex").removeClass("matIndex");
            $(elm).addClass("matIndex");
            $(elm)[0].scrollIntoViewIfNeeded();
            Uti.Msg("hili:" + document.g_matchIndex + "/" + document.g_matchCount);
            document.g_matchIndex += incrs;
            return;
        }
        $(".mat").removeClass("matIndex");
        $(".mat").removeClass("mat");
        document.g_matchStrin = str;
        document.g_matchCount = 0;
        document.g_matchIndex = 0;
        $("a[vid]").each(function (idx) {
            var ss = $(this).text();
            var mat = ss.match(reg);
            if (mat) {
                $.each(mat, function (i, v) {
                    if (0 == i) {
                        ss = ss.replace(v, "<font class='mat'>" + v + "</font>");
                    }
                });
                $(this).html(ss).prev().attr("checked", true);
                document.g_matchCount++;
            };
        });
        Uti.Msg("tot:" + document.g_matchCount);
        if (document.g_matchCount > 0) {//save to history.
            var inp = { Search: { File: RestApi.HistFile.__history_regex_search, Strn: str } };
            var prm = { api: RestApi.ApiBibleObj_access_regex_search_history, inp: inp };
            Jsonpster.Run(prm, function () {
                Uti.Msg("found");
            });
        };
    };
    function onclick_BibleObj_search_str() {
        var s = $("#sinput").val().trim();
        var inp = gBim.get_selected_load_parm();
        inp.Search = gBim.get_selected_Search_Parm();
        if (!Uti.validateSearch(inp)) return;
        console.log(inp);
        var par = { api: RestApi.ApiBibleObj_load_Bkns_Vols_Chp_Vrs, inp: inp };
        Uti.Msg(par);
        Jsonpster.Run(par, apiCallback_Gen_clientBibleObj_table);

        console.log(Jsonpster);
        var unicds = "";
        for (var i = 0; i < s.length; i++) {
            var ch = s.charCodeAt(i);
            if (ch > 512) {
                unicds += "\\u" + ch.toString(16);
            }

        }
        Uti.Msg(s);
        Uti.Msg(unicds);

    }

    function LoadBible_HiliVerse_by_vol_chp_vrs(prm) {
        var vid = prm.vol + prm.chp + ":" + prm.vrs;
        prm.vrs = "*";
        prm.vol_arr = [prm.vol];
        var bibOj = Uti.get_xOj(prm);
        var fnamesArr = gBim.get_selected_bkn_fnamesArr();
        var inp = { fname: fnamesArr, bibOj: bibOj, Search: { File: "", Strn: "" } };
        console.log(inp);
        var par = { api: RestApi.ApiBibleObj_load_Bkns_Vols_Chp_Vrs, inp: inp };
        Jsonpster.Run(par, function (ret) {
            apiCallback_Gen_clientBibleObj_table(ret);
            Uti.scrollIntoViewIfNeeded_to_vid(vid);
        });
    }
    function Set_BibleIpnut_UI(prm) {
        var s = "<tr><td class='v3 hili'>" + prm.vol + "</td></tr>";
        $("#Tab_vol tbody").html(s);
        $("#chp_cap").text(prm.chp);
    }
    function onclick_NextChp(i) {
        if (null === i || 0 === i) {
            onclick_chp_loadBible();
            return;
        }

        if ($(".v3.hili").length != 1) return Uti.Msg("vol.len!=1");
        var vol = $(".v3.hili").text();
        if (vol.length === 0) return alert("Fatal err vol=null");

        var chp = $("#chp_cap").text();
        if (chp === "*") {
            if (1 === i) chp = 0;
            if (-1 === i) {
                chp = 1 + Object.keys(_Max_struct[vol]).length;
            }
        };
        var ichp = parseInt(chp) + i;
        if (ichp < 1 || ichp > 150) return alert(ichp + " ichp out of range.");

        if (undefined == _Max_struct[vol]["" + ichp]) return alert(vol + " has no:" + ichp);
        $("#chp_cap").text(ichp);

        reset_chp_num($("#Tab_chp"));

        onclick_chp_loadBible();
    }
    function onclick_chp_loadBible() {
        var parm = gBim.get_selected_vcv_parm();
        parm.vrs = "*";
        if (parm.vol_arr.length >= 66) {
            if (!confirm("load the whole bible of 66?")) {
                return;
            }
        }
        var bibOj = Uti.get_xOj(parm);
        console.log("Obj=", bibOj);
        var fnamesArr = gBim.get_selected_bkn_fnamesArr();
        var inp = { fname: fnamesArr, bibOj: bibOj, Search: null };
        var par = { api: RestApi.ApiBibleObj_load_Bkns_Vols_Chp_Vrs, inp: inp };
        Uti.Msg(par);
        Jsonpster.Run(par, apiCallback_Gen_clientBibleObj_table);
    };
    function onclick_load_vcv_history(bSortByTime) {
        var inp = { Search: { File: RestApi.HistFile.__history_verses_loaded } };
        var prm = { api: RestApi.ApiBibleObj_access_regex_search_history, inp: inp };
        Jsonpster.Run(prm, function (ret) {
            //history
            console.log(ret);
            var ops = Uti.read_history_to_opt(ret, bSortByTime);
            $("#Tab_load_vcv_history tbody").html(ops.join("")).find(".option").bind("click", function () {
                $(".option").removeClass("hili");
                $(this).addClass("hili");
                var s = $(this).text();
                var mat = s.match(/^(\w{3})[\s]{0,}(\d+)\s{0,}[\:]\s{0,}(\d+)\s{0,}$/);
                if (mat) {
                    console.log(mat);
                    var vcv = { vol: mat[1], chp: mat[2], vrs: mat[3] };
                    LoadBible_HiliVerse_by_vol_chp_vrs(vcv);
                    Set_BibleIpnut_UI(vcv);

                } else { alert("vcv err:" + s) }
            });

        });
    };///
    function onclick_load_search_string_history(bSortByTime) {
        var inp = { Search: { File: RestApi.HistFile.__history_regex_search, Strn: null } };//readonly.
        var prm = { api: RestApi.ApiBibleObj_access_regex_search_history, inp: inp };
        Jsonpster.Run(prm, function (ret) {
            //history
            console.log(ret);
            var ops = Uti.read_history_to_opt(ret, true);
            $("#Tab_regex_history_lst tbody").html(ops.join("")).find(".option").bind("click", function () {
                $(this).toggleClass("hili");
                var s = $(this).text().trim();
                $("#sinput").val(s);
            });
        });
    };

    function reset_chp_num(eTab) {
        var nVol = $(".v3.hili").length;
        if (nVol != 1) {
            $(eTab).find(".chp_num").attr("disabled", true);
            return;
        }
        var vol = $(".v3.hili").text();
        var cap = $("#chp_cap").text();
        var icap = parseInt(cap);
        if (!Number.isInteger(icap)) {
            icap = 0;
        }
        $(eTab).find(".chp_num").attr("disabled", null);

        $(eTab).find(".chp_num").each(function () {
            var idn = parseInt($(this).text());
            var chp = icap * 10 + idn;
            if (undefined === _Max_struct[vol][chp]) {
                $(this).attr("disabled", true);
            }
        });
    }
    function reset_rse_num(eTab) {
        var clnam = ".vrs_num";
        var nVol = $(".v3.hili").length;
        if (nVol != 1) {
            $(eTab).find(clnam).attr("disabled", true);
            return;
        }
        var vol = $(".v3.hili").text();
        var cap = $("#vrs_cap").text();
        var icap = parseInt(cap);
        if (!Number.isInteger(icap)) {
            icap = 0;
        }
        var chp = $("#chp_cap").text();

        $(eTab).find(clnam).attr("disabled", null);

        $(eTab).find(clnam).each(function () {
            var idn = parseInt($(this).text());
            var rse = icap * 10 + idn;
            if (undefined === _Max_struct[vol][chp] || undefined === _Max_struct[vol][chp][rse]) {
                $(this).attr("disabled", true);
            }
        });
    }
    function onclick_chp_digi(_this) {
        var dici = $(_this).text();

        var eTab = $(_this).parentsUntil("table").parent();

        var eCap = eTab.find(".digiCap");
        var scap = eCap.text();
        var icap = parseInt(scap);
        if (!Number.isInteger(icap)) {
            icap = 0;
        }
        var updateCap = icap * 10 + parseInt(dici);

        var nVol = $(".v3.hili").length;
        if (nVol != 1) {
            return alert("vol != 1");
        }
        var vol = $(".v3.hili").text();
        if (undefined === _Max_struct[vol]) {
            return alert(vol + " not exist!");
        }
        var maxchp = Object.keys(_Max_struct[vol]).length;
        if (undefined === _Max_struct[vol][updateCap]) {
            return alert(vol + "_" + updateCap + " not exist!\n chpMax=" + maxchp);
        }

        eCap.text(updateCap);
        onclick_chp_loadBible();

        //prepare for next available digits.
        reset_chp_num(eTab);
    }
    function onclick_rse_digi(_this) {
        var dici = $(_this).text();

        var eTab = $(_this).parentsUntil("table").parent();

        var eCap = eTab.find(".digiCap");
        var scap = eCap.text();
        var icap = parseInt(scap);
        if (!Number.isInteger(icap)) {
            icap = 0;
        }
        var updateCap = icap * 10 + parseInt(dici);

        var nVol = $(".v3.hili").length;
        if (nVol != 1) {
            return alert("vol != 1");
        }
        var vol = $(".v3.hili").text();
        if (undefined === _Max_struct[vol]) {
            return alert(vol + " not exist!");
        }
        var maxchp = Object.keys(_Max_struct[vol]).length;
        var chp = $("#chp_cap").text();
        if (undefined === _Max_struct[vol][chp]) {
            return alert(vol + "_" + chp + " not exist!\n chp Max=" + maxchp);
        }
        var maxrse = Object.keys(_Max_struct[vol][chp]).length;
        var chp = $("#chp_cap").text();
        if (undefined === _Max_struct[vol][chp][updateCap]) {
            return alert(vol + "_" + chp + ":" + updateCap + " not exist!\n rse Max=" + maxrse);
        }

        eCap.text(updateCap);
        var vcr = vol + chp + ":" + updateCap;
        Uti.scrollIntoViewIfNeeded_to_vid(vcr);

        //prepare for next available digits.
        reset_rse_num(eTab);
        return;
        $(eTab).find("button[disabled]").attr("disabled", null);
        $(eTab).find(".digit").each(function () {
            var iDig = parseInt($(this).text());
            var nextChp = 10 * updateCap + iDig;
            if (undefined === _Max_struct[vol][chp][nextChp]) {
                $(this).attr("disabled", true);
            }
        });
    };








var Uti = {
    validateBibleLoad: function (inp) {
        if (null === inp.bibOj) {
            //alert("bibOj=null");
            return false;
            if (confirm("load the whole Bible?")) {
                inp.bibOj = {};
            } else {
                return false;
            }
        }
        if (inp.fname.length === 0) {
            alert("Please select a biblical BooK Name.");
            return false;
        }
        var volArr = Object.keys(inp.bibOj);
        if (volArr.length >= 66) {
            var s = JSON.stringify(inp);
            s += "\n\nLoad whole Bible vol=" + volArr.length + "\nContinue?";
            return confirm(s);
        }
        return true;
    },
    validateSearch: function (inp) {
        if (!inp.Search.File) {
            alert("no searchFile");
            return false;
        }
        if (inp.Search.Strn.length == 0) {
            alert("no searchStrn");
            return false;
        }
        return true;
    },


    Msg: function (dat) {
        var str = dat;
        if ("object" === typeof dat) {
            str = JSON.stringify(dat, null, 4);
        }
        var results = str + "\n" + $("#searchResult").val();
        //results = results.substr(0, 60);
        $("#searchResult").val(results);
    },
    scrollIntoViewIfNeeded_to_vid(vid) {
        //var vid = $(this).text().trim();
        $(".vid.hiliScroll2View").removeClass("hiliScroll2View");
        var bfind = false;
        $("#oBible").find(".vid").each(function () {
            var vid2 = $(this).text().trim();
            if (vid === vid2) {
                $(this)[0].scrollIntoViewIfNeeded();
                $(this).addClass("hiliScroll2View");
                bfind = true;
            }
        });
        return bfind;
    },
    read_history_to_opt: function (ret, bSortByTime) {
        var ops = [];
        $.each(ret, function (vol, chobj) {
            $.each(chobj, function (chp, vrsObj) {
                $.each(vrsObj, function (vrs, ob) {
                    $.each(ob, function (searchStr, tm) {
                        if (!bSortByTime) tm = "";
                        ops.push("<tr><td class='option' time='" + tm + "'>" + searchStr + " &nbsp;&nbsp;&nbsp;&nbsp;</td></tr>");
                    });
                });
            });
        });
        ops.sort();
        if (bSortByTime) {
            ops.reverse();
        }
        return ops;
    },
    vcv_parser: function (vid) {
        vid = vid.replace(/\s/g, "");
        if (vid.length === 0) return alert("please select an item first.");
        var ret = { vol: "", chp: "", vrs: "" };
        var mat = vid.match(/^(\w{3})\s{,+}(\d+)\s{,+}[\:]\s{,+}(\d+)\s{,+}$/);
        var mat = vid.match(/^(\w{3})\s+(\d+)\s+[\:]\s+(\d+)\s+$/);
        var mat = vid.match(/^(\w{3})(\d+)\:(\d+)$/);
        if (mat) {
            ret.vol = mat[1];
            ret.chp = mat[2];
            ret.vrs = mat[3];
        } else {
            alert("vid=" + vid + "," + JSON.stringify(ret));
        }
        ret.chp3 = ret.chp.padStart(3, "0");
        ret._vol = "_" + ret.vol;
        return ret;
    },
    get_cha_arr_after_str: function (str, BibleObjStruct) {
        if (!BibleObjStruct) return [];
        var ret = {};
        Object.keys(BibleObjStruct).forEach(function (v) {
            if (v.indexOf(str) == 0) {
                var idx = str.length;
                if (v.length > idx) {
                    var ch = v[idx];
                    if (!ret[ch]) ret[ch] = 0;
                    ret[ch]++;
                }
            }
        });
        var ks = Object.keys(ret).sort();
        return ks;
    },
    Get_Vol_Arr_from_KeyChar: function (ch, BibleObjStruct) {
        var arr = [];
        Object.keys(BibleObjStruct).forEach(function (vol) {
            if (vol.indexOf(ch) == 0) {
                arr.push(vol);
            };
        });
        return arr;
    },
    Gen_Vom_trs: function (vol_arr) {
        var cls = " class='v3 hili' ";
        var trarr = [];
        vol_arr.forEach(function (vol) {
            //<td align='right'>"+BibVolName[vol][0]+"</td>
            trarr.push("<tr><td" + cls + "title='" + CNST.BibVolNameEngChn(vol) + "'>" + vol + "</td></tr>");
            cls = " class='v3' ";
        });
        return trarr.join("");
    },
    validate_vcv_xxxxxx: function (vol, chp, vrs) {
        if (undefined == _Max_struct[vol]) return alert("fatal err vol=" + vol);
        else if (undefined == _Max_struct[vol][chp]) {
            var ichp = parseInt(chp);
            if (Number.isInteger(ichp)) {
                var max = Object.keys(_Max_struct[vol]).length;
                if (parseInt(chp) > max) {
                    return alert("input chp=" + chp + ":\n" + vol + " max chapter is " + max);
                }
            }

        }
        else if (undefined == _Max_struct[vol][chp][vrs]) {
            var ivrs = parseInt(vrs);
            if (Number.isInteger(ivrs)) {
                var max = Object.keys(_Max_struct[vol][chp]).length;
                if (parseInt(vrs) >= max) {
                    return alert("input vrs=" + vrs + ":\n" + vol + " " + chp + " max verse is " + max);
                }
            }
        }
        return true;
    },
    get_xOj: function (par) {
        return Uti.get_bibOj(par.vol_arr, par.chp, par.vrs);
    },
    get_bibOj: function (vol_arr, chp, vrs) {
        if ("object" != typeof vol_arr) {
            alert("assertion failed: vol must be arry");
            return null;
        }
        if (!vol_arr === 0) {
            //alert("vol_arr is empty");
            return {};
        }
        var bibOj = {};
        ////vol
        var vol = "";
        for (var i = 0; i < vol_arr.length; i++) {
            vol = vol_arr[i];
            if (undefined === _Max_struct[vol]) {
                alert("invalide vol=" + vol);
                return null;
            }
            bibOj[vol] = {};
        }
        if (vol_arr.length > 1) {//for cat or multiple vol names.
            return bibOj;
        };////////////////////////////////////////////////
        ////////
        //vol 1, chp
        //
        if (chp.length == 0) { return bibOj; }
        if (isNaN(chp)) {
            console.log("chp isNaN:", chp);
            return bibOj;
        }
        if (undefined === _Max_struct[vol][chp]) {
            alert("ERR:\n" + vol + "_" + chp + "\n not exist.")
            return null;
        }
        bibOj[vol][chp] = {};
        /////
        //vrs
        if (vrs.length === 0) { return bibOj; }

        if (isNaN(vrs)) {
            console.log("vrs isNaN:", vrs);
            return bibOj;
        }
        if (undefined === _Max_struct[vol][chp][vrs]) {
            alert("ERR:\n" + vol + "_" + chp + ":" + vrs + " not exist.")
            return null;
        }
        bibOj[vol][chp][vrs] = "";
        return bibOj;
    },

    gen_clientBibleObj_table: function (ret) {
        var idx = 0, st = "";
        $.each(ret, function (vol, chpObj) {
            $.each(chpObj, function (chp, vrsObj) {
                $.each(vrsObj, function (vrs, val) {
                    //console.log("typeof val=", typeof val);
                    idx++;
                    var vid = vol + "<br>" + chp + ":" + vrs;
                    st += "<tr><td class='vid'>" + vid + "</td><td>";
                    if ("object" == typeof val) {
                        $.each(val, function (key, str) {
                            var vid = vol + chp + ":" + vrs;
                            st += `<div><input type='checkbox' title='${key}'/><a class='tx tx${key}' vid='${vid}'>${str}</a></div>`;
                        });
                    }
                    if ("string" == typeof val) {
                        st += "<div>" + val + "</div>";
                    }
                    st += "</td></tr>";
                });
            });
        });

        var s = "<table id='BibOut' border='1'>";
        s += `<caption><p/><p>TotRows=${idx}</p></caption>`;
        s += "<thead><th>vcv</th><th>scripts</th></thead>";
        s += "<tbody>";
        s += st;

        s += "</tbody></table>";
        return { htm: s, size: idx };
    },
};////  Uti
////////////////////////////////////
const CNST = {
}



var BibleInputMenuContainer = `
<style>
    body {
        background-color: black;
        color: white;
        width: 100%;
        font-size: 100%;

        padding: 0px 0px 0px 0px;
        margin: 0px 0px 0px 0px;

        font-family: 'Times New Roman';
    }
</style>

<div id="menuContainer">
    <div id="BibInputMenuHolder">
        <div id="ID_BibleInputMenuContainer">
            <table border="1" id="Tab_BibleSingleInputKey">
                <caption id="BibleInputCap">Bible Input Keys</caption>
                <thead id=""></thead>
                <tbody id=""></tbody>
            </table>
            <table id="Tab_bkn" border="1" style="float:left;">
                <caption class='bbbCap' id='bkn_cap' title='Biblical Book Name'>BKN</caption>
                <thead id=""></thead>
                <tbody id=''>
                    <tr>
                        <td></td>
                    </tr>
                </tbody>
            </table>
            <table border="1" style="float:left;" id="Tab_cat">
                <caption class='' id='' title='Volumns Catagory'>Cat</caption>
                <thead id=""></thead>
                <tbody id=''>
                    <tr>
                        <td></td>
                    </tr>
                </tbody>
            </table>

            <table id="Tab_vol" border="1" style="float:left;">
                <caption class='vcvCap' id='vol_capx' title='volunm name'>V<sub id="vol_cap_sub">0</sub></caption>
                <thead id=""></thead>
                <tbody id=''>

                </tbody>
            </table>

            <table id='Tab_chp' border="1" style="float:;">
                <caption>
                    <a onclick='onclick_NextChp(-1)'>chp-</a>
                    <button class='digiCap' id='chp_cap' onclick='onclick_NextChp(0)' title='chapter'>*</button>
                    <a onclick='onclick_NextChp(+1)'> + &nbsp; </a>
                    </caption>
                <thead id=""></thead>
                <tbody id=''>
                    <tr>
                        <td></td>
                    </tr>
                </tbody>
            </table>
            <a style="float:;"></a>

            <table id="Tab_vrs" border="1" style="float;">
                <caption>vrs <button class='digiCap' id='vrs_cap' title='verse'>*</button>
                    <button id="loadVolChpVrs" onclick='onclick_load_BknVolChpVrs();' title='Load Bible'>.</button>
                    </caption>
                <thead id=""></thead>
                <tbody id="">
                    <tr>
                        <td></td>
                    </tr>
                </tbody>
            </table>
            



        </div>
        <div id="ID_Explore">

            <input id="sinput" cols='50' onclick="onclick_load_search_string_history();" ></input><br>

            <button onclick="onclick_BibleObj_search_str();" title="search on svr">search</button>
            <button onclick="onclick_regex_match_next(-1);" title="find on page">Prev</button>
            <button onclick="onclick_regex_match_next(1);" title="find on page">Next</button>
            
            <button id="loadhistory" onclick='onclick_load_vcv_history(1);' title='load history sort by time'>h</button>
            <button id="sort_history_by_vcvID" onclick='onclick_load_vcv_history(0);' title='load history sort by str'>^</button>
            <button onclick="$('#searchResult').val('');" title='clearout txt'></button>
            <br>
            <textarea id="searchResult" cols="50"  value='search results...' title='load search history.'>
                </textarea><br>

            

            <table id="Tab_regex_history_lst" border='1' style="float:left;">
                <tbody>
                    <tr>
                        <td>
                            click search results<br>
                            to show history serch<br>                           

                        </td>
                    </tr>
                </tbody>
            </table>

            <table id="Tab_load_vcv_history" border="1" style="float:left;">
                <caption><span id='loads_buttons'>
                        <span>
                </caption>
                <thead></thead>
                <tbody>
                    <tr>
                        <td>
                            Pleas click H button <br>for History.<br>
                            <br>
                            Pleas click ^ button <br>sort by str.<br>

                        </td>
                    </tr>
                </tbody>
            </table>
            
        </div>
    </div>
    <div id="others">
            <table id='tmpsel2ref' border="1" align="left">
                <thead></thead>
                <tbody>
                </tbody>
            </table>

            <table id='refslist' border="1" align="left">
                <!--thead><th>#</th><th>vcv</th><th>refs</th></thead--->
                <tbody>
                    <tr>
                        <td>
                            <a id="blb" ref="https://www.blueletterbible.org/kjv/">blueletter</a>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <a id="h_g" ref="../../../../../../../___bigdata/unzipped/rel/ham12/hgsbible/hgb/" title='Hebrew_Greek'>h_g</a>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <a id="gtw" ref="https://www.biblegateway.com/passage/?search=" title='biblegateway.com'>gateway</a>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <a id="studylight" ref="https://www.studylight.org/commentary/" title='studylight.org'>studylight</a>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <a id="ccel_org" ref="http://www.ccel.org/study/" title='ChristianClassicEtherealLib'>ccel</a>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <a id="crossReference" ref="https://www.openbible.info/labs/cross-references/search?q=" title='cross-references'>cross-references</a>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div id="othersx">
        <button id="oBible_indxer">indxer</button>
        <button id="Compare_vcv">Compare_vcv</button>
        <a href='../index.htm'>ref</a>

        <table border="1">
            <thead>
                <tr>
                    <td>#</td>
                    <td>Vol</td>
                    <td>Chp</td>
                    <td>Ver</td>
                </tr>
            </thead>
            <tbody id="StructAna"></tbody>
        </table>
        <input id="CopyTextToClipboard" title="CopyTextToClipboard"/><br>
        <button onclick="txFontsizeIncrs(10);" title='font-size plus'>f+</button><button onclick="txFontsizeIncrs(-10);">f-</button>
    </div>

        </div>

    

</div>
<hr />
<button id="menuToggler" onclick="$('#menuContainer').slideToggle();">-</button>
<div id='oBible'>----</div>

        `;//////backtick for multiple lines. 

function txFontsizeIncrs(n) {
    if (undefined === document.m_tx_fontSize) {
        document.m_tx_fontSize = 16;
    }
    //var fsize=$("#oBible table .tx").css("font-size");
    document.m_tx_fontSize += n;
    $("#oBible table .tx").css("font-size", document.m_tx_fontSize);
}

CNST.FnameOfBibleObj =
    {
        "BBE": "Basic Bible in English",
        "CUVS": "Chinese Union Version Simplified, 官話和合本, 1919",
        "CUVsen": "CUV Simplied with English Name",
        "CUVpy": "Chinese Union Version PinYing",
        "ESV": "English Standard Version",
        "H_G": "Hebrew and Greek",
        "KJV": "King James Version",
        "KJV_Jw": "King James Version Jesus' Words",
        "NIV": "New International Version",
        "NIV_Jw": "New International Version Jesus' Words",
        "STUS": "Studium Biblicum Version by Catholic,1968",
        "WLVS": "Wen Li Version. 文理和合本新約全書於1906年出版，新舊約全書於1919年出版.修訂新約後的新舊約全書，於1923年出版，至1934年印行最後一版, 原本分為官話、深文理、淺文理三種譯本，稱為「聖經唯一，譯本則三」。後來深淺文理合併為文理和合本 https://zh.wikisource.org/wiki/%E8%81%96%E7%B6%93_(%E5%92%8C%E5%90%88%E6%9C%AC) \n\nFor 1895 新約淺文理(包爾騰(John Shaw Burdon)、柏亨利(Henry Blodget)) https://bible.fhl.net/ob/nob.html?book=8 ",
        "_CrossRef": "cross-references",
        "_bnotes": "personal biblical study notes",
        "_crf": "self added cross-references",
        "_xrand": "personal extra random notes."
    };

CNST.BibVolName = {
    "Gen": ['Genesis', 'genesis', '创世纪',],
    "Exo": ['Exodus', 'exodus', '出埃及记',],
    "Lev": ['Leviticus', 'leviticus', '利未记',],
    "Num": ['Numbers', 'numbers', '民数记',],
    "Deu": ['Deuteronomy', 'deuteronomy', '申命记',],
    "Jos": ['Joshua', 'joshua', '约书亚记',],
    "Jug": ['Judges', 'judges', '士师记',],
    "Rut": ['Ruth', 'ruth', '路得记',],
    "1Sa": ['1_Samuel', '1-samuel', '撒母耳记上',],
    "2Sa": ['2_Samuel', '2-samuel', '撒母耳记下',],
    "1Ki": ['1_Kings', '1-kings', '列王记上',],
    "2Ki": ['2_Kings', '2-kings', '列王记下',],
    "1Ch": ['1_Chronicles', '1-chronicles', '历代志上',],
    "2Ch": ['2_Chronicles', '2-chronicles', '历代志下',],
    "Ezr": ['Ezra', 'ezra', '以斯拉记',],
    "Neh": ['Nehemiah', 'nehemiah', '尼希米记',],
    "Est": ['Esther', 'esther', '以斯帖记',],
    "Job": ['Job', 'job', '约伯记',],
    "Psm": ['Psalm', 'psalm', '诗篇',],
    "Pro": ['Proverbs', 'proverbs', '箴言',],
    "Ecc": ['Ecclesiastes', 'ecclesiastes', '传道书',],
    "Son": ['SongOfSolomon', 'song-of-solomon', '雅歌',],
    "Isa": ['Isaiah', 'isaiah', '以赛亚书',],
    "Jer": ['Jeremiah', 'jeremiah', '耶利米书',],
    "Lam": ['Lamentations', 'lamentations', '耶利米哀歌',],
    "Eze": ['Ezekiel', 'ezekiel', '以西结书',],
    "Dan": ['Daniel', 'daniel', '但以理书',],
    "Hos": ['Hosea', 'hosea', '何西阿书',],
    "Joe": ['Joel', 'joel', '约珥书',],
    "Amo": ['Amos', 'amos', '阿摩司书',],
    "Oba": ['Obadiah', 'obadiah', '俄巴底亚书',],
    "Jon": ['Jonah', 'jonah', '约拿书',],
    "Mic": ['Micah', 'micah', '弥迦书',],
    "Nah": ['Nahum', 'nahum', '那鸿书',],
    "Hab": ['Habakkuk', 'habakkuk', '哈巴谷书',],
    "Zep": ['Zephaniah', 'zephaniah', '西番雅书',],
    "Hag": ['Haggai', 'haggai', '哈该书',],
    "Zec": ['Zechariah', 'zechariah', '撒迦利亚',],
    "Mal": ['Malachi', 'malachi', '玛拉基书',],
    "Mat": ['Matthew', 'matthew', '马太福音',],
    "Mak": ['Mark', 'mark', '马可福音',],
    "Luk": ['Luke', 'luke', '路加福音',],
    "Jhn": ['John', 'john', '约翰福音',],
    "Act": ['Acts', 'acts', '使徒行传',],
    "Rom": ['Romans', 'romans', '罗马书',],
    "1Co": ['1_Corinthians', '1-corinthians', '哥林多前书',],
    "2Co": ['2_Corinthians', '2-corinthians', '哥林多后书',],
    "Gal": ['Galatians', 'galatians', '加拉太书',],
    "Eph": ['Ephesians', 'ephesians', '以弗所书',],
    "Phl": ['Philippians', 'philippians', '腓立比书',],
    "Col": ['Colossians', 'colossians', '歌罗西书',],
    "1Ts": ['1_Thessalonians', '1-thessalonians', '帖撒罗尼迦前书',],
    "2Ts": ['2_Thessalonians', '2-thessalonians', '帖撒罗尼迦后书',],
    "1Ti": ['1_Timothy', '1-timothy', '提摩太前书',],
    "2Ti": ['2_Timothy', '2-timothy', '提摩太后书',],
    "Tit": ['Titus', 'titus', '提多书',],
    "Phm": ['Philemon', 'philemon', '腓利门书',],
    "Heb": ['Hebrews', 'hebrews', '希伯来书',],
    "Jas": ['James', 'james', '雅各书',],
    "1Pe": ['1_Peter', '1-peter', '彼得前书',],
    "2Pe": ['2_Peter', '2-peter', '彼得后书',],
    "1Jn": ['1_John', '1-john', '约翰一书',],
    "2Jn": ['2_John', '2-john', '约翰二书',],
    "3Jn": ['3_John', '3-john', '约翰三书',],
    "Jud": ['Jude', 'jude', '犹大书',],
    "Rev": ['Revelation', 'revelation', '启示录',],
};
CNST.BibVolNameEngChn = function (Vid) {
    return CNST.BibVolName[Vid][0] + " " + CNST.BibVolName[Vid][2];
};
CNST.BibVolName_Studylight = function (Vid) {
    return CNST.BibVolName[Vid][1];
};
CNST.BibVolName_ccel = function (Vid) {
    return CNST.BibVolName[Vid][0];
};
CNST.BlueLetterBibleCode = {
    "Gen": "Gen",
    "Exo": "Exo",
    "Lev": "Lev",
    "Num": "Num",
    "Deu": "Deu",
    "Jos": "Jos",
    "Jug": "Jug",
    "Rut": "Rut",
    "1Sa": "1Sa",
    "2Sa": "2Sa",
    "1Ki": "1Ki",
    "2Ki": "2Ki",
    "1Ch": "1Ch",
    "2Ch": "2Ch",
    "Ezr": "Ezr",
    "Neh": "Neh",
    "Est": "Est",
    "Job": "Job",
    "Psm": "Psa",//
    "Pro": "Pro",
    "Ecc": "Ecc",
    "Son": "Son",
    "Isa": "Isa",
    "Jer": "Jer",
    "Lam": "Lam",
    "Eze": "Eze",
    "Dan": "Dan",
    "Hos": "Hos",
    "Joe": "Joe",
    "Amo": "Amo",
    "Oba": "Oba",
    "Jon": "Jon",
    "Mic": "Mic",
    "Nah": "Nah",
    "Hab": "Hab",
    "Zep": "Zep",
    "Hag": "Hag",
    "Zec": "Zec",
    "Mal": "Mal",
    "Mat": "Mat",
    "Mak": "Mak",
    "Luk": "Luk",
    "Jhn": "Jhn",
    "Act": "Act",
    "Rom": "Rom",
    "1Co": "1Co",
    "2Co": "2Co",
    "Gal": "Gal",
    "Eph": "Eph",
    "Phl": "Phl",
    "Col": "Col",
    "1Ts": "1Ts",
    "2Ts": "2Ts",
    "1Ti": "1Ti",
    "2Ti": "2Ti",
    "Tit": "Tit",
    "Phm": "Phm",
    "Heb": "Heb",
    "Jas": "Jas",
    "1Pe": "1Pe",
    "2Pe": "2Pe",
    "1Jn": "1Jn",
    "2Jn": "2Jn",
    "3Jn": "3Jn",
    "Jud": "Jud",
    "Rev": "Rev",
};//BookChapterVerseMax
CNST.BookID2IdxCode = {
    _Gen: ['01', 'h'],
    _Exo: ['02', 'h'],
    _Lev: ['03', 'h'],
    _Num: ['04', 'h'],
    _Deu: ['05', 'h'],
    _Jos: ['06', 'h'],
    _Jug: ['07', 'h'],
    _Rut: ['08', 'h'],
    _1Sa: ['09', 'h'],
    _2Sa: ['10', 'h'],
    _1Ki: ['11', 'h'],
    _2Ki: ['12', 'h'],
    _1Ch: ['13', 'h'],
    _2Ch: ['14', 'h'],
    _Ezr: ['15', 'h'],
    _Neh: ['16', 'h'],
    _Est: ['17', 'h'],
    _Job: ['18', 'h'],
    _Psm: ['19', 'h'],
    _Pro: ['20', 'h'],
    _Ecc: ['21', 'h'],
    _Son: ['22', 'h'],
    _Isa: ['23', 'h'],
    _Jer: ['24', 'h'],
    _Lam: ['25', 'h'],
    _Eze: ['26', 'h'],
    _Dan: ['27', 'h'],
    _Hos: ['28', 'h'],
    _Joe: ['29', 'h'],
    _Amo: ['30', 'h'],
    _Oba: ['31', 'h'],
    _Jon: ['32', 'h'],
    _Mic: ['33', 'h'],
    _Nah: ['34', 'h'],
    _Hab: ['35', 'h'],
    _Zep: ['36', 'h'],
    _Hag: ['37', 'h'],
    _Zec: ['38', 'h'],
    _Mal: ['39', 'h'],
    _Mat: ['40', 'b'],
    _Mak: ['41', 'b'],
    _Luk: ['42', 'b'],
    _Jhn: ['43', 'b'],
    _Act: ['44', 'b'],
    _Rom: ['45', 'b'],
    _1Co: ['46', 'b'],
    _2Co: ['47', 'b'],
    _Gal: ['48', 'b'],
    _Eph: ['49', 'b'],
    _Phl: ['50', 'b'],
    _Col: ['51', 'b'],
    _1Ts: ['52', 'b'],
    _2Ts: ['53', 'b'],
    _1Ti: ['54', 'b'],
    _2Ti: ['55', 'b'],
    _Tit: ['56', 'b'],
    _Phm: ['57', 'b'],
    _Heb: ['58', 'b'],
    _Jas: ['59', 'b'],
    _1Pe: ['60', 'b'],
    _2Pe: ['61', 'b'],
    _1Jn: ['62', 'b'],
    _2Jn: ['63', 'b'],
    _3Jn: ['64', 'b'],
    _Jud: ['65', 'b'],
    _Rev: ['66', 'b'],
};
CNST.OT_Vols_Ary = [
    "Gen",
    "Exo",
    "Lev",
    "Num",
    "Deu",
    "Jos",
    "Jug",
    "Rut",
    "1Sa",
    "2Sa",
    "1Ki",
    "2Ki",
    "1Ch",
    "2Ch",
    "Ezr",
    "Neh",
    "Est",
    "Job",
    "Psm",
    "Pro",
    "Ecc",
    "Son",
    "Isa",
    "Jer",
    "Lam",
    "Eze",
    "Dan",
    "Hos",
    "Joe",
    "Amo",
    "Oba",
    "Jon",
    "Mic",
    "Nah",
    "Hab",
    "Zep",
    "Hag",
    "Zec",
    "Mal"
];
CNST.NT_Vols_Ary = [
    "Mat",
    "Mak",
    "Luk",
    "Jhn",
    "Act",
    "Rom",
    "1Co",
    "2Co",
    "Gal",
    "Eph",
    "Phl",
    "Col",
    "1Ts",
    "2Ts",
    "1Ti",
    "2Ti",
    "Tit",
    "Phm",
    "Heb",
    "Jas",
    "1Pe",
    "2Pe",
    "1Jn",
    "2Jn",
    "3Jn",
    "Jud",
    "Rev"
];
CNST.Cat2VolArr = {
    "OT": CNST.OT_Vols_Ary,
    "Moses": ["Gen", "Exo", "Lev", "Num", "Deu"],
    "History": ["Jos", "Jug", "Rut", "1Sa", "2Sa", "1Ki", "2Ki", "1Ch", "2Ch", "Ezr", "Neh", "Est"],
    "Literature": ["Job", "Psm", "Pro", "Ecc", "Son"],
    "MajorPr": ["Isa", "Jer", "Lam", "Eze", "Dan"],
    "MinorPr": ["Joe", "Amo", "Oba", "Jon", "Mic", "Nah", "Hab", "Zep", "Hag", "Zec", "Mal"],
    "NT": CNST.NT_Vols_Ary,
    "Gospel": ["Mat", "Mak", "Luk", "Jhn"],
    "Paulines": ["Rom", "1Co", "2Co", "Gal", "Eph", "Phl", "Col", "1Ts", "2Ts", "1Ti", "2Ti", "Tit", "Phm"],
    "Epistles": ["Heb", "Jas", "1Pe", "2Pe", "1Jn", "2Jn", "3Jn", "Jud"]
};
var BookJsFlavor = {
    OTNT: ['#510000', 'wholistic Bible', '圣经全书'],
    OT: ['#001040', 'O.T.', '旧约全书'],
    Moses: ['#002E63', 'Moses', '摩西五经'],
    History: ['#002E63', 'History', '历史'],
    Literature: ['#002E63', 'Literature', '文学'],
    Major_Prophets: ['#002E63', 'Major_Prophets', '大先知'],
    Minor_Prophets: ['#002E63', 'Minor_Prophets', '小先知'],
    NT: ['#4053A9', 'N.T.', '新约全书'],
    Gospels: ['#003399', 'Gospels', '四福音书'],
    HisSayings: ['#003399', 'HisSayings', '耶稣话语'],
    Pauls: ['#003399', 'Pauls', '保罗书信'],
    Other_Epistles: ['#003399', 'OtherEpistles', '其他书信'],
};
