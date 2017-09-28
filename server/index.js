const express = require('express');
const jsdom = require("jsdom/lib/old-api.js");
const cors = require('cors');
const scrape = require('website-scraper');
const fs = require('fs');

app = express();
app.use(cors());

//TODO: refactor into proper DB LOL!
user_position = {}

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
    var fullDir = './scraped/' + req.query.name + '/index.html';
    var url = 'http://' + req.query.name + '.com';
    var user = req.query.uuid;
    var htmlSource = fs.readFileSync(fullDir, "utf8");
    var currentNode = user_position.user;
    callJSDOM(htmlSource, function(window) {
        var $ = window.$;
        console.log('user:' + user_position.user);
        do {
            if (user_position.user == null)
                currentNode = $('body');
            if ($(currentNode).children().length) {
                console.log('children');
                currentNode = $(currentNode).children()[0];
            } else if ($(currentNode).next().length) {
                currentNode = $(currentNode).next()[0];
                console.log('sibling');
            } else {
                while ($(currentNode).next().length == 0 && $(currentNode) != $('body')) {
                    currentNode = $(currentNode).parent()[0];
                    console.log('back out');
                }
                if ($(currentNode).next().length) {
                    console.log('sibling');
                    currentNode = $(currentNode).next()[0];
                }
            }
            user_position.user = currentNode;
        } while (immediateText($(currentNode)) == 0);
        console.log('user:' + user_position.user);
        $(currentNode).css('color', '#F00');
        fs.writeFileSync(fullDir, $('html')[0].outerHTML);
        $('#jsdom').remove();
        res.end();
    });

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
            return false;
        }
    }

});

app.get("*", function(req, res) {
    response.end("404!");
});

app.listen(8080);