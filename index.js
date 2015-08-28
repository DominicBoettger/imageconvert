#! /usr/bin/env node

var fs = require('fs');
var program = require('commander');
var async = require('async');
var fileType = require('file-type');
var path = require("path");
var readChunk = require('read-chunk');
var gm = require('gm');
var mkdirp = require('mkdirp');
var optimage = require('optimage');

program
  .version('1.0.1')
  .option('-p, --path [path]', 'Add the path to scan [path]')
  .parse(process.argv);

var resolution = [
  640,
  1536,
  2048,
  2880
]

if(program.path) {
  fs.readdir(program.path, function(err, files) {
    mkdirp(program.path + '/__output/', function(err) {
      if(!err) {
        files.map(function (file) {
          return path.join(program.path, file);
        }).filter(function (file) {
          return fs.statSync(file).isFile();
        }).filter(function(file) {
          var buffer = readChunk.sync(file, 0, 262);
          var type = fileType(buffer);
          if(type && type.mime == 'image/jpeg') {
            return true
          }
          return false;
        }).forEach(function (file) {
          async.eachSeries(resolution, function(res, cb) {
            var newName = path.dirname(file) + '/__output/' + path.basename(file, path.extname(file)) + '_' + res + path.extname(file);
            console.log(newName);
            gm(file)
            .scale(res)
            .write(newName, function (err) {
              if (err) {
                console.log(err);
              } else {
                // optimizing the image
                optimage({
                    inputFile: newName,
                    outputFile: newName
                  }, function(err, res){
                    cb();
                });
              }
            });
          }, function(err) {
            console.log('All resolitions for '+ path.basename(file) +' converted');
          });
        });
      } else {
        console.log('error while creating output dir');
      }
    });
  });
}
