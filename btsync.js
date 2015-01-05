
var btsync = {};
var mkdirp = require('mkdirp');

var btsi = require('btsync')({
    host: 'localhost',
    port: 8888,
    username: 'admin',
    password: 'password',
});

btsync.exists = function(secret, callback) {

    secret = secret.trim();

    btsi.getFolders({
        'secret': secret
    }).then(function(data){
        console.log(data);

        if (data.length >0)
            callback(true);
        else
            callback(false);

    }, function(error){
        console.error(error);
        callback(false);
    });
};

btsync.create = function(name, secret) {

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

    var name = postData.match(/\[(.+)\]\[/g);
    var secret = postData.match(/\]\[(.+)\]/g);

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
    var name = postData.match(/\[(.+)\]\[/g);
    var secret = postData.match(/\]\[(.+)\]/g);

    if(name.length > 0 && secret.length > 0){
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
