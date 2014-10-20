/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";

    var mysql = require("mysql"),
        connection = null;

    function cmdConnect(db_connect, callback) {
        connection = mysql.createConnection({
            host : db_connect.host,
            port : db_connect.port,
            user : db_connect.user,
            password : db_connect.pass,
            database : db_connect.database
        });

        connection.connect(function (err) {
            if (err) {
                callback(err);
            }

            callback(null, connection.threadId);
        });
    }

    function cmdDisconnect(callback) {
        connection.end(function (err) {
            if (err) {
                callback(err);
            }

            callback(null, 1);
        });
    }

    function cmdQuerying(query, callback) {
        connection.query(query, function (err, rows, fields) {
            if (err) {
                callback(err);
            }

            callback(null, [fields, rows]);
        });
    }

    function init(domainManager) {
        if (!domainManager.hasDomain("simple")) {
            domainManager.registerDomain("simple", {major: 0, minor: 1});
        }

        domainManager.registerCommand(
            "simple",       // domain name
            "connect",    // command name
            cmdConnect,   // command handler function
            true,          // this command is synchronous in Node
            "Connect to a database"
        );

        domainManager.registerCommand(
            "simple",
            "disconnect",
            cmdDisconnect,
            true,
            "Disconnect from database"
        );

        domainManager.registerCommand(
            "simple",
            "query",
            cmdQuerying,
            true,
            "Querying a database"
        );
    }

    exports.init = init;

}());
