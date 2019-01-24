const express = require('express');        // call express
const app = express();                 // define our app using express
var bodyParser = require('body-parser');
//var stripe     = require("stripe")("CUSTOM_TEST_TOKEN");
var url = require('url');


////////////////////////////////
//server site workload.
const fs = require('fs');
var path = require('path');
var cheerio = require("cheerio"); //>> npm install cheerio




app.get("/", (req, res) => {
  console.log("root ok");
  //res.send("<script>alert(\'ss\');</script>");
  var obj = { samp: 'ffa' };
  var s = JSON.stringify(obj);
  res.send("clientSiteFuntion(" + s + ");");
});

app.get("/save2afile", (req, res) => {
  console.log("root", req.url);

  var q = url.parse(req.url, true).query;
  var txt = q.fname + " " + q.dat;
  console.log(q);

  q.dat = decodeURIComponent(q.dat);//must see client encodeURIComponent.
  fs.writeFileSync(q.fname, q.dat, 'utf8');

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<html><body><h>' + JSON.stringify(q, null, 4) + "</h></body></html>");
  res.end();
  //res.json(q);
  //res.send("<a/>")
  //console.log(txt);
});






var Uti = {
  getFileNamesFromDir: function (startPath, filter) {
    function recursiveDir(startPath, filter, xx) {
      var files = fs.readdirSync(startPath);
      for (var i = 0; i < files.length; i++) {
        var filename = path.join(startPath, files[i]);
        //console.log(filename);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
          recursiveDir(filename, filter); //recurse
        }
        else if (filename.indexOf(filter) >= 0) {
          //console.log('-- found: ',filename);
          outFilesArr.push(filename);
        };
      };
    }
    var outFilesArr = [];
    recursiveDir(startPath, filter);
    return outFilesArr;
  },
};//////Uti//////




var HebrewQ = function () {

}
HebrewQ.prototype.get_VocabHebrewBufObj = function () {
  var currentPath = process.cwd();
  console.log(currentPath);

  var filesArr = Uti.getFileNamesFromDir("../../../../../../btool/tool/HebrewQ/audjs/", ".js");
  console.log(filesArr);

  //return;
  var targf = "../../../../../../btool/tool/HebrewQ/audjs/VocabHebrewBuf.js"
  var content = fs.readFileSync(targf, "utf8");
  var idx = 2 + content.indexOf("=\n");
  var shead = content.substr(0, idx);
  console.log("shead==", shead);
  content = content.substring(idx);

  var obj = JSON.parse(content);
  Object.keys(obj).forEach(function (k) {
    var arr = obj[k];
    //console.log(k,arr);
  });
  return { header: shead, obj: obj, fname: targf };
}

var hbrq = new HebrewQ();
app.get("/updateVocabHebrewBuf", (req, res) => {
  console.log("root", req.url);

  var q = url.parse(req.url, true).query;
  var txt = q.fname + " " + q.dat;
  console.log(q);

  q.dat = decodeURIComponent(q.dat);//must see client encodeURIComponent.
  fs.writeFileSync(q.fname, q.dat, 'utf8');

  var upobj = JSON.parse(q.dat);
  var rsObj = hbrq.get_VocabHebrewBufObj();
  Object.keys(upobj).forEach(function (k) {
    rsObj.obj[k] = upobj[k];
  });
  var s = rsObj.header;
  s += JSON.stringify(rsObj.obj, null, 4);
  fs.writeFileSync(rsObj.fname, s);



  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<html><body><h>' + JSON.stringify(q, null, 4) + "</h></body></html>");
  res.end();
  //res.json(q);
  //res.send("<a/>")
  //console.log(txt);
});



var port = 7778;
app.listen(7778, () => {
  console.log("app listern port:7778...");
  hbrq.get_VocabHebrewBufObj();
});
console.log("port:", port);
///////////////////////////////
//php -S localhost:7778
// will override nodejs. server

/////////////////////////
// Server Site:
// nodemon a.node.js
//
// client site:
// open restapi_tester.htm
// then click index button.
