/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global $, define, brackets, Mustache */

define(function (require, exports, module) {
    "use strict";

    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus = brackets.getModule("command/Menus"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
        AppInit = brackets.getModule("utils/AppInit"),
        NodeDomain = brackets.getModule("utils/NodeDomain");

    // Panel
    var ext_id = "brackets-database.panel",
        panel;

    // Templates
    var panelTemplate = require("text!templates/database-panel.html"),
        connectTemplate = require("text!templates/database-connect.html"),
        tableTemplate = require("text!templates/table-result.html");

    // Html Templates
    var connectHtml = Mustache.render(connectTemplate);

    // Styles
    ExtensionUtils.loadStyleSheet(module, "styles/database.less");

    // Global Vars
    var db_connect = null,
        is_connected = false;

    function handlePanel() {
        if (panel.isVisible()) {
            panel.hide();
        } else {
            panel.show();

            if (!is_connected) {
                $("#database-panel .table-container").html(connectHtml);
            }
        }
    }

    var simpleDomain = new NodeDomain("simple", ExtensionUtils.getModulePath(module, "node/SimpleDomain"));

    function connect() {
        db_connect = {
            host: $("#host").val(),
            port: $("#port").val(),
            user: $("#user").val(),
            pass: $("#password").val(),
            database: $("#database").val()
        };

        simpleDomain.exec("connect", db_connect).done(function (id) {
            console.log("[Brackets-Database] connection id: " + id);
            $(".db-connect").attr("disabled", "disabled");
            $(".db-disconnect").removeAttr("disabled");
            $(".db-query").removeAttr("disabled");
            $(".db-run-query").removeAttr("disabled");
            $(".db-list-tables").removeAttr("disabled");

            is_connected = true;

            $("#database-panel .table-container").html("");
        }).fail(function (err) {
            console.error("[Brackets-Database] failed to connect database", err);
        });
    }

    function disconnect() {
        simpleDomain.exec("disconnect").done(function () {
            console.log("[Brackets-Database] Success");
            $(".db-connect").removeAttr("disabled");
            $(".db-disconnect").attr("disabled", "disabled");
            $(".db-query").attr("disabled", "disabled");
            $(".db-run-query").attr("disabled", "disabled");
            $(".db-list-tables").attr("disabled", "disabled");

            $(".db-query").val("");

            is_connected = false;
            $("#database-panel .table-container").html(connectHtml);
        }).fail(function (err) {
            console.error("[Brackets-Database] failed to disconnect from database", err);
        });
    }

    function querying(query) {
        var rows = [],
            rows_array = [],
            result_array = [];

        simpleDomain.exec("query", query).done(function (table) {
            $("#database-panel .table-container").html("");

            rows = table[1];

            rows.forEach(function (row) {
                result_array = [];

                $.each(row, function (key, value) {
                    if (value === null) {
                        result_array.push('null');
                    } else if (value === 0) {
                        result_array.push('0');
                    } else if (value.length === 0) {
                        result_array.push(' ');
                    } else {
                        result_array.push(value);
                    }
                });

                rows_array.push(result_array);
            });

            var tableHtml = Mustache.render(tableTemplate, {fields: table[0], rows: rows_array});
            $("#database-panel .table-container").append(tableHtml);
        }).fail(function (err) {
            console.log(err);
        });
    }

    function run_query() {
        var str_query = $(".db-query").val();
        querying(str_query);
    }

    function list_tables() {
        querying("show table status");
    }

    function initActions() {
        panel.$panel.on("click", ".close", handlePanel);
        panel.$panel.on("click", ".db-connect", connect);
        panel.$panel.on("click", ".db-disconnect", disconnect);
        panel.$panel.on("click", ".db-run-query", run_query);
        panel.$panel.on("click", ".db-list-tables", list_tables);

        panel.$panel.on("keydown", function (event) {
            if (event.which === 13) {
                run_query();
            }
        });
    }

    AppInit.appReady(function () {
        var panelHtml = Mustache.render(panelTemplate);
        var $panelHtml = $(panelHtml);

        panel = WorkspaceManager.createBottomPanel(ext_id, $panelHtml, 100);

        CommandManager.register("Database Client", ext_id, handlePanel);

        var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
        menu.addMenuItem(ext_id);

        initActions();
    });
});
