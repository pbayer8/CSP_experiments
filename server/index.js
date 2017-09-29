var express = require('express');
var app = express();
var jsdom = require('jsdom/lib/old-api.js');
var cors = require('cors');
var scrape = require('website-scraper');
var fs = require('fs');
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);

app.use(cors());

//TODO: refactor into proper DB LOL!
userLocation = {}

function callJSDOM(source, callback) {
    jsdom.env(
        source, ['../app/jquery-3.2.1.min.js'],
        function(errors, window) {
            process.nextTick(
                function() {
                    if (errors) {
                        throw new Error("There were errors: " + errors);
                    }
                    callback(window);
                }
            );
        }
    );
}

function immediateText(node, text, callback) {
    if (text == null && callback == null) {
        try {

            textVal = node.contents().filter(function() {
                return this.nodeType == 3;
            })[0].nodeValue;
        } catch (err) {
            //TODO: proper error handling
            textVal = " ";
        }
        return textVal.trim().length;
    } else {
        textVal = node.contents().filter(function() {
            return this.nodeType == 3;
        })[0].nodeValue = text;
        callback();
    }
}

function highlightNewRed(window, user, direction, callback) {
    var $ = window.$;
    var items = window.document.body.getElementsByTagName('*');
    var len = items.length;
    var currNode;
    $(items[userLocation[user].pos]).removeAttr('style');
    do {
        userLocation[user].pos += direction;
        currNode = $(items[userLocation[user].pos]);
    } while (immediateText(currNode) == 0 && userLocation[user].pos < len && userLocation[user].pos >= 0);
    if (userLocation[user].pos >= len)
        userLocation[user].pos = 0;
    else if (userLocation[user].pos <= 0)
        userLocation[user].pos = len - 1;
    //TODO: header hack!
    $(items[userLocation[user].pos]).css('color', '#F00');
    callback();
}

function clearHighlights(window, user, callback) {
    var items = window.document.body.getElementsByTagName('*');
    var $ = window.$;
    var len = items.length;
    userLocation[user].pos = 0;
    do {
        userLocation[user].pos++;
        currNode = $(items[userLocation[user].pos]);
        if (immediateText(currNode))
            currNode.removeAttr('style');
    } while (userLocation[user].pos < len);
    callback();
}

function getDirs(name) {
    var dirs = {}
    dirs.server = '../app/scraped/' + name;
    dirs.serverFile = '../app/scraped/' + name + '/index.html';
    dirs.client = './scraped/' + name + '/index.html';
    dirs.url = 'http://' + name + '.com';
    return dirs;
}

function writeFileEmitPage(dirs, socket, window) {
    var $ = window.$;
    $('html').find('script').remove();
    fs.writeFileSync(dirs.serverFile, window.document.documentElement.outerHTML);
    socket.emit('new_page', { src: dirs.client });
}

//TODO: refactor into proper cloud storage maybe w/ DB lookup

io.on('connection', function(socket) {
    socket.on('refresh', function(data) {
        var dirs = getDirs(data.page);
        var options = {
            urls: [dirs.url],
            directory: dirs.server
        };
        scrape(options).then((result) => {
            socket.emit('new_page', { src: dirs.client });
        }).catch((err) => {
            socket.emit('new_page', { src: dirs.client });
        });
    });

    socket.on('enter_edit', function(data) {
        var dirs = getDirs(data.page);
        var user = data.user;
        if (userLocation[user] == null) {
            userLocation[user] = {};
        }
        userLocation[user].pos = 0;
        var htmlSource = fs.readFileSync(dirs.serverFile, "utf8");
        var currNode = null;
        callJSDOM(htmlSource, function(window) {
            userLocation[user].window = window;
            highlightNewRed(window, user, 1, () => {
                writeFileEmitPage(dirs, socket, window);
            });
        });
    });

    socket.on('edit', function(data) {
        var dirs = getDirs(data.page);
        var user = data.user;
        var window = userLocation[user].window;
        var $ = window.$;
        var items = window.document.body.getElementsByTagName('*');
        var len = items.length;
        currNode = $(items[userLocation[user].pos]);
        immediateText(currNode, data.text, () => {
            writeFileEmitPage(dirs, socket, window);
        });
    });

    socket.on('nav', function(data) {
        var dirs = getDirs(data.page);
        var user = data.user;
        var window = userLocation[user].window;
        highlightNewRed(window, user, data.direction, () => {
            writeFileEmitPage(dirs, socket, window);
        });
    });

    socket.on('leave_edit', function(data) {
        var dirs = getDirs(data.page);
        var user = data.user;
        var window = userLocation[user].window;
        clearHighlights(window, user, () => {
            writeFileEmitPage(dirs, socket, window);
        });
    });
    socket.on('disconnect', function() {
        io.emit('news');
    });
});

var options = {
    index: "index.html"
};

app.use('/', express.static('app/', options));

app.get("*", function(req, res) {
    res.end("404!");
});

server.listen(8080);