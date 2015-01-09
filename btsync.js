(function(module) {
    "use strict";


    var btsync = {};
    var mkdirp = require('mkdirp');

    var Promise = require('bluebird');

    var BtsyncRequire = require('bittorrent-sync');
    var btsi = new BtsyncRequire({
        host: 'localhost',
        port: 8888,
        username: 'admin',
        password: 'password',
        timeout: 10000
    });

    Promise.promisifyAll(btsi);


    btsync.clean = function(string) {
        var clean = string.trim();
        clean = clean.replace(/(\[|\])/g, "");
        return clean;
    };

    /*
        pulls secrets out of string returns as array, if number of secrets or names not the same extras are droped
        one secret to every name

        [
            {name: "blah", secret: "asdfasdf"},
            {name: "blah", secret: "asdfasdf"},
        ]
    */
    btsync.getSecrets = function(content){
        var result = [];
        // create an object for each secret and name
        var name = content.match(/\[(.+)\]\[/g);
        var secret = content.match(/\]\[(.+)\]/g);

        if (secret === null || secret === null){
            return result;
        }

        for( var i = 0; i < Math.min(name.length,secret.length); i++){
            result[i] = {};
            result[i].name = btsync.clean(name[i]);
            result[i].secret = btsync.clean(secret[i]);
        }

        console.log( " we got some secrets: " + result.length +  " : " + JSON.stringify(result));
        return result;
    };

    btsync.insertAfterSecret = function(content, add, secret){
        var result;

        console.log("secret: " + secret + "\n\n");
        console.log( "before: " + content + "\n\n");
        var regString = "(\\[.+\\]\\[\\s*"+secret+"\\s*\\])";
        console.log( "regX string: " + regString);
        var re = new RegExp(regString,"g");
        var temp = content.split(re);



        console.log( "legth: " + temp.length + " temp: " + JSON.stringify(temp));

        temp[1] = temp[1] + add ;

        result = temp.join("");



        console.log( "\n\nafter: " + result);
        return result;
    };

    btsync.exists = function(secret, callback) {

        btsi.getFolders({
            secret: secret.secret
            }, function(err, data) {
            if (err) {
                callback(err,false);
            }else{

                if (data.length >0){
                    console.log("it exists!" + JSON.stringify(data) );
                    callback(err,true, data);
                }
                else{
                    console.log("it does -NOT- exists!" + secret );
                    callback(err, false);
                }
            }
        });

        return;
    };

    btsync.create = function(name, secret, callback) {

        console.log("attempting to create : " + name + " with " + secret);
        var directory = '/opt/btsync/data/' + name ;

        // make directory in file system
        mkdirp(directory, function (err) {
            if (err){
                console.error(err);
                console.error("failed to make directory");
                callback(err);
            }
            else{
                console.error("successfuly made the directory :" + directory);
                // add directory to btsync
                btsi.addFolder({
                    dir: directory,
                    secret: secret
                }, function(err, data) {
                    if (err)
                        console.error('failed to add to btsync'+ err);
                    else
                        console.log('created '+ directory);
                    callback(err, data);
                });
            }
        });
    };


    btsync.parseBefore = function(postData){

        var secrets = btsync.getSecrets(postData.content);


        if (secrets.length < 1){
            callback(null,postData);
            return;
        }

        for(var i=0;i<secrets.length;i++)
        {

            var currentSecret = secrets[i];

            (function(currentSecret) {
                btsync.exists(currentSecret, function(err, exists){

                    if(err){
                        console.error(" error finding out if it exists" + err);
                    }
                    else if (!exists){
                        console.log(" try and create " + currentSecret.name + " " + currentSecret.secret);
                        btsync.create(currentSecret.name, currentSecret.secret, function(error, data){
                            if(error)
                                console.error("failed to add to btsync: " + error);
                            else
                                console.log("suscess: created btsync folder");

                        });
                    }
                    else{
                    }
                });

            })(currentSecret);
        }
    };

    btsync.parseAfter = function(postData, callback){


        var count = 0;

        var content = postData.postData.content;
        var newContent = content;
        var secrets = btsync.getSecrets(content);

        if (secrets.length < 1){
            callback(null,postData);
            return;
        }

        for(var i=0;i<secrets.length;i++){

            var currentSecret = secrets[i];

            (function(currentSecret) {
                btsync.exists(currentSecret, function(err, exists, data){
                    if(err){
                        console.error(" error finding out if it exists" + err);
                        //callback(err, false);
                    }
                    else if (exists){
                            var add = "<p> <pre id='json'><code>" + JSON.stringify(data) + "</pre></code> </p>";
                            newContent = btsync.insertAfterSecret(content, add, currentSecret.secret);



                    }
                    count++;
                    if (count == secrets.length)
                    {
                        postData.postData.content = newContent;
                        callback(null, postData);
                    }

                });
            })(currentSecret);
        }


    };

    module.exports = btsync;



    //btsync.parseBefore({content: "    [test][RR745RPH5URZVEWS7NSY2KR2V3DKKPBGU]   "}, function(){});
    //console.log("---------------")


//    btsync.parseAfter({postData:{content: "    [test][RR745RPH5URZVEWS7NSY2KR2V3DKKPBGU]   "}}, function(){});



}(module));
