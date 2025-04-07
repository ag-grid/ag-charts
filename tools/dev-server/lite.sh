#!/bin/bash

# Create a simple HTTPS server that maps /charts/dev/ to packages/
node -e '
const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

// Function to generate self-signed certificate
function generateSelfSignedCert() {
    const homeDir = os.homedir();
    const certPath = path.join(homeDir, ".vite-plugin-mkcert", "cert.pem");
    const keyPath = path.join(homeDir, ".vite-plugin-mkcert", "dev.pem");

    // Check if certificates already exist
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        return {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath)
        };
    }

    // Generate new certificates using OpenSSL
    try {
        // Create directory if it does not exist
        const certDir = path.dirname(certPath);
        if (!fs.existsSync(certDir)) {
            fs.mkdirSync(certDir, { recursive: true });
        }

        // Generate private key
        execSync(`openssl genrsa -out "${keyPath}" 2048`);
        // Generate self-signed certificate
        execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/CN=localhost"`);
        
        console.log("Generated new SSL certificates");
    } catch (error) {
        console.error("Failed to generate certificates:", error.message);
        process.exit(1);
    }

    return {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath)
    };
}

// Function to format timestamp
function getTimestamp() {
    return new Date().toISOString();
}

// Function to log requests
function logRequest(req, statusCode, filePath) {
    const timestamp = getTimestamp();
    const method = req.method;
    const url = req.url;
    const status = statusCode;
    const path = filePath || "N/A";
    console.log(`[${timestamp}] ${method} ${url} - ${status} - ${path}`);
}

const credentials = generateSelfSignedCert();

const server = https.createServer(credentials, (req, res) => {
    // Add CORS headers
    res.setHeader("Access-Control-Allow-Origin", "https://run.plnkr.co");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    
    // Handle preflight requests
    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    // Only handle paths starting with /charts/dev/
    if (!req.url.startsWith("/charts/dev/")) {
        logRequest(req, 404);
        res.writeHead(404);
        res.end("Not found");
        return;
    }

    // Remove /charts/dev/ prefix and construct the file path
    const filePath = path.join("packages", req.url.slice("/charts/dev/".length));

    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            logRequest(req, 404, filePath);
            res.writeHead(404);
            res.end("File not found");
            return;
        }

        // Set appropriate content type based on file extension
        const ext = path.extname(filePath);
        const contentType = {
            ".html": "text/html",
            ".js": "text/javascript",
            ".css": "text/css",
            ".json": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon",
        }[ext] || "text/plain";

        logRequest(req, 200, filePath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    });
});

const PORT = 4600;
server.listen(PORT, () => {
    console.log(`Server running at https://localhost:${PORT}`);
    console.log("Mapping /charts/dev/ to packages/ folder");
});
'