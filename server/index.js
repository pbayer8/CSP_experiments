const express = require('express');
const jsdom = require("jsdom/lib/old-api.js");
const cors = require('cors');
const scrape = require('website-scraper');
const fs = require('fs');
const io = require('socket.io');

app = express();
app.use(cors());

//TODO: refactor into proper DB LOL!
user_position = {}

function callJSDOM(source, callback) {
    jsdom.env(
        source, ['../app/jquery-3.2.1.min.js'], // (*)
        function(errors, window) { // (**)
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

function immediateText(node, text) {
    if (text == null) {
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
        return true;
    }
}



//TODO: refactor into proper cloud storage maybe w/ DB lookup
app.get('/proxy', function(req, res) {
    var serverDir = '../app/scraped/' + req.query.name;
    var clientDir = './scraped/' + req.query.name + '/index.html';
    var url = 'http://' + req.query.name + '.com';

    var options = {
        urls: [url],
        directory: serverDir,
    };

    // with promise
    scrape(options).then((result) => {
        res.end(clientDir);
    }).catch((err) => {
        res.end(clientDir);
    });

});

app.get('/edit', function(req, res) {
    var serverDir = '../app/scraped/' + req.query.name + '/index.html';
    var clientDir = './scraped/' + req.query.name + '/index.html';
    var url = 'http://' + req.query.name + '.com';
    var user = req.query.uuid;
    var text = '';
    if (req.query.text)
        text = req.query.text;
    var htmlSource = fs.readFileSync(serverDir, "utf8");
    var currNode = null;
    if (user_position[user] == null) {
        user_position[user] = {};
        user_position[user].pos = 0;
    }
    callJSDOM(htmlSource, function(window) {
        var $ = window.$;
        var items = window.document.body.getElementsByTagName('*');
        var len = items.length;
        if (user == 'clear') {
            user_position[user].pos = 0;
            do {
                user_position[user].pos++;
                currNode = $(items[user_position[user].pos]);
                currNode.removeAttr('style');
            } while (immediateText(currNode) == 0 && user_position[user].pos < len);
            res.end(clientDir);
        }
        if (text.length) {
            currNode = $(items[user_position[user].pos]);
            immediateText(currNode, text);
        } else {
            $(items[user_position[user].pos]).removeAttr('style');
            do {
                user_position[user].pos++;
                currNode = $(items[user_position[user].pos]);
            } while (immediateText(currNode) == 0 && user_position[user].pos < len);
            if (user_position[user].pos >= len)
                user_position[user].pos = 0;
            //TODO: header hack!
            //NOTE: script tag removal broken
            $(items[user_position[user].pos]).css('color', '#F00');
        }
        $('script#jsdom').remove();
        fs.writeFileSync(serverDir, $('html')[0].outerHTML);
        res.end(clientDir);
    });

});


var options = {
  index: "index.html"
};

app.use('/', express.static('app/', options));

app.get("*", function(req, res) {
    res.end("404!");
});

app.listen(8080);