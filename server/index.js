const express = require('express');
const jsdom = require("jsdom/lib/old-api.js");
const cors = require('cors');
const scrape = require('website-scraper');
const fs = require('fs');

app = express();
app.use(cors());

//TODO: refactor into proper DB LOL!
user_position = {}

function callJSDOM(source, callback) {
    jsdom.env(
        source, ['../jquery-3.2.1.min.js'], // (*)
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
            console.log(textVal);
            console.log(textVal.trim().length);
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
    var dir = './scraped/' + req.query.name;
    var fullDir = './server/scraped/' + req.query.name + '/index.html';
    var url = 'http://' + req.query.name + '.com';

    var options = {
        urls: [url],
        directory: dir,
    };

    // with promise
    scrape(options).then((result) => {
        console.log('scraping');
        res.end(fullDir);
    }).catch((err) => {
        res.end(fullDir);
    });

});

app.get('/edit', function(req, res) {
    console.log('edit');
    var dir = './scraped/' + req.query.name;
    var localFullDir = './scraped/' + req.query.name + '/index.html';
    var fullDir = './server/scraped/' + req.query.name + '/index.html';
    var url = 'http://' + req.query.name + '.com';
    var user = req.query.uuid;
    var text = '';
    if (req.query.text)
        text = req.query.text;
    var htmlSource = fs.readFileSync(localFullDir, "utf8");
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
            res.end(fullDir);
        }
        if (text.length) {
            currNode = $(items[user_position[user].pos]);
            immediateText(currNode, text);
        } else {
            $(items[user_position[user].pos]).removeAttr('style');
            do {
                user_position[user].pos++;
                currNode = $(items[user_position[user].pos]);
                console.log(currNode);
            } while (immediateText(currNode) == 0 && user_position[user].pos < len);
            if (user_position[user].pos >= len)
                user_position[user].pos = 0;
            //TODO: header hack!
            //NOTE: script tag removal broken
            $(items[user_position[user].pos]).css('color', '#F00');
        }
        $('script#jsdom').remove();
        fs.writeFileSync(localFullDir, $('html')[0].outerHTML);
        res.end(fullDir);
    });

});



app.get("*", function(req, res) {
    response.end("404!");
});

app.listen(8080);