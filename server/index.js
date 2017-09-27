var express = require('express');
var jsdom = require('jsdom');
var request = require('request');
var http = require('http');
var cors = require('cors');
var httpProxy = require('http-proxy');
var scrape = require('website-scraper');
var url = require('url');

app = express();
app.use(cors());
// app.all("*", function(request, response, next) {
//     response.writeHead(200, { "Content-Type": "text/plain" });
//     next();
// });


var proxy = httpProxy.createProxyServer({});


app.get("/frame", function(request, response) {
    response.end("Welcome to the about page!");
});
app.get('/proxy', function(req, res) {
    // proxy.web(req, res, { target: req.query.url });
    // proxy.on('proxyRes', function(proxyRes, request, response) {
    //     proxyRes.pipe(response);
    // });
    // request.pipe(require('request')('http://leaf.com' )).pipe(response);
    //request(req.query.url).pipe(res);
    var dir = './scraped_' + req.query.name;
    var fullDir = './server/scraped_' + req.query.name + '/index.html';
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
        console.log(err)
        res.end(fullDir);
    });

    // var queryData = url.parse(req.query.url, true).query;
    // if (queryData.url) {
    //     request({
    //         url: queryData.url
    //     }).on('error', function(e) {
    //         res.end(e);
    //     }).pipe(res);
    // }
    //res.end();
});
app.get('/nodetube', function(request, response) {
    //Tell the request that we want to fetch youtube.com, send the results to a callback function
    // request({ uri: 'http://leaf.com' }, function(err, response, body) {
    //     var self = this;
    //     self.items = new Array(); //I feel like I want to save my results in an array

    //Just a basic error check
    // if (err && response.statusCode !== 200) { console.log('Request error.'); }
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
    // res.end(body);
    // });
});

app.get("*", function(request, response) {
    response.end("404!");
});

app.listen(7000);