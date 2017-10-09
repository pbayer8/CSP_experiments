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

//TODO:
// multiuser functionality
// multiuser features
// bots
// think about layers fo interaction

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
    io.emit('new_page', { src: dirs.client });
}

//TODO: refactor into proper cloud storage maybe w/ DB lookup

io.on('connection', function(socket) {
    socket.on('refresh', function(data) {
        var dirs = getDirs(data.page);
        var options = {
            urls: [dirs.url],
            directory: dirs.server,
            sources: [
                { selector: 'img', attr: 'src' },
                { selector: 'link[rel="stylesheet"]', attr: 'href' },
                { selector: 'style' },
                { selector: '[style]', attr: 'style' },
                { selector: 'img', attr: 'src' },
                { selector: 'img', attr: 'srcset' },
                { selector: 'input', attr: 'src' },
                { selector: 'object', attr: 'data' },
                { selector: 'embed', attr: 'src' },
                { selector: 'param[name="movie"]', attr: 'value' },
                // { selector: 'script', attr: 'src' },
                { selector: 'link[rel="stylesheet"]', attr: 'href' },
                { selector: 'link[rel*="icon"]', attr: 'href' },
                { selector: 'svg *[xlink\\:href]', attr: 'xlink:href' },
                { selector: 'svg *[href]', attr: 'href' },
                { selector: 'picture source', attr: 'srcset' },
                { selector: 'meta[property="og\\:image"]', attr: 'content' },
                { selector: 'meta[property="og\\:image\\:url"]', attr: 'content' },
                { selector: 'meta[property="og\\:image\\:secure_url"]', attr: 'content' },
                { selector: 'meta[property="og\\:audio"]', attr: 'content' },
                { selector: 'meta[property="og\\:audio\\:url"]', attr: 'content' },
                { selector: 'meta[property="og\\:audio\\:secure_url"]', attr: 'content' },
                { selector: 'meta[property="og\\:video"]', attr: 'content' },
                { selector: 'meta[property="og\\:video\\:url"]', attr: 'content' },
                { selector: 'meta[property="og\\:video\\:secure_url"]', attr: 'content' },
                { selector: 'video', attr: 'src' },
                { selector: 'video source', attr: 'src' },
                { selector: 'video track', attr: 'src' },
                { selector: 'audio', attr: 'src' },
                { selector: 'audio source', attr: 'src' },
                { selector: 'audio track', attr: 'src' },
                // { selector: 'frame', attr: 'src' },
                // { selector: 'iframe', attr: 'src' }
            ]
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

app.use('/', express.static('../app', options));

app.get("*", function(req, res) {
    res.end("404!");
});

server.listen(3000);