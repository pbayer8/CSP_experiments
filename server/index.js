const express = require('express'),
    jsdom = require('jsdom'),
    request = require('request'),
    http = require('http'),
    cors = require('cors'),
    url = require('url');

app = express();
app.use(cors());
app.all("*", function(request, response, next) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    next();
});

app.get("/frame", function(request, response) {
    response.end("Welcome to the about page!");
});

app.get('/nodetube', function(req, res) {
    //Tell the request that we want to fetch youtube.com, send the results to a callback function
    request({ uri: 'http://leaf.com' }, function(err, response, body) {
        var self = this;
        self.items = new Array(); //I feel like I want to save my results in an array

        //Just a basic error check
        if (err && response.statusCode !== 200) { console.log('Request error.'); }
        //Send the body param as the HTML code we will parse in jsdom
        //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
        // jsdom.env({
        //     html: body,
        //     scripts: ['http://code.jquery.com/jquery-1.6.min.js']
        // }, function(err, window) {
        //     //Use jQuery just as in a regular HTML page
        //     var $ = window.jQuery;

        //     console.log($('title').text());
        //     res.end($('title').text());
        // });
        res.end(body);
    });
});

app.get("*", function(request, response) {
    response.end("404!");
});

app.listen(7000);