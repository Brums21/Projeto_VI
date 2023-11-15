const http = require('http'); 
const fs = require('fs');
const path = require('path'); 

// Requiring module
const express = require('express');
 
// Creating express object
const app = express(); 

const hostname = '127.0.0.1';
const port = 3000;

// Function to serve all static files
// inside public directory.
app.use(express.static('public'));
app.use('/images', express.static('images'));

const server = http.createServer( (req, res) => {

    let filePath = '';

    switch(req.url) {
        case '/':
            filePath = __dirname + '/pages/index.html';
            break;
        case '/js/influx.js':
            filePath = __dirname + '/js/influx.js';
            break;
        default:
            filePath = __dirname + '/pages/index.html';
            break;
    }
    

    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(err.message);
            res.statusCode = 500; // Internal Server Error
            res.setHeader('Content-Type', 'text/plain');
            res.end('Internal Server Error');
            return;
        }

        const extname = path.extname(filePath);
        let contentType = 'text/html';
    
        switch (extname) {
          case '.js':
            contentType = 'text/javascript';
            break;
          default:
            break;
        }

        res.statusCode = 200; // ok
        res.setHeader('Content-Type', contentType);
        res.end(data, 'utf8');
    });

});

server.listen(port, hostname, () => {
    console.log(`Server is running at http://${hostname}:${port}`);
});