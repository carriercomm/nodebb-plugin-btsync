(function(module) {
    "use strict";

    console.log("HELLO WORLD -BTSYNC");

    var btsync = {};
    var mkdirp = require('mkdirp');

    var btsi = require('btsync')({
        host: 'localhost',
        port: 8888,
        username: 'admin',
        password: 'password',
    });


    console.log("HELLO WORLD got to functions ");

    btsync.exists = function(secret, callback) {
        console.log("HELLO WORLD exists");

        secret = secret.trim();

        btsi.getFolders({
            'secret': secret
        }).then(function(data){
            console.log(data);

            if (typeof data != 'undefined' && data.length >0)
                callback(true);
            else
                callback(false);

        }, function(error){
            console.error(error);
            callback(false);
        });
    };

    btsync.create = function(name, secret) {
        console.log("HELLO WORLD create");

        var directory = '/opt/btsync/data/' + name.trim() ;

        // make directory in file system
        mkdirp(directory, function (err) {
            if (err){
                console.error(err);
                console.error("failed to make btsync");
            }
            else{
                // add directory to btsync
                bts.addFolder({
                    dir: directory
                }, function(err, data) {
                    if (err) throw err;
                    console.log('created '+ directory);
                    console.log(data);
                });

            }
        });
    };

    btsync.parseBefore = function(postData){
        console.log("HELLO WORLD parse before");
        console.log(JSON.stringify(postData));

        if (typeof postData == 'undefined')
            return;

        var name = postData.content.match(/\[(.+)\]\[/g);
        var secret = postData.content.match(/\]\[(.+)\]/g);

        if(name.length > 0 && secret.length > 0){
            for(var i=0; i<name.length; i++){

                btsync.exists(secret[i], function(exists){
                    if(!exists)
                        btsync.create(secret[i]);
                    else
                        console.log("already exists");
                });


            }
        }


    };

    btsync.parseAfter = function(postData){
        console.log("HELLO WORLD parse after");

        if (typeof postData == 'undefined')
            return;

        var name = postData.content.match(/\[(.+)\]\[/g);
        var secret = postData.content.match(/\]\[(.+)\]/g);

        if(typeof name != 'undefined' && name.length > 0 && typeof secret != 'undefined' && secret.length > 0){
            for(var i=0; i<name.length; i++){

                btsync.exists(secret[i], function(exists){
                    if(exists)
                        console.log("do something");
                    else
                        console.log("do nothing");
                });


            }
        }
    };



    module.exports = btsync;


    console.log("HELLO WORLD done loading??");
}(module));
