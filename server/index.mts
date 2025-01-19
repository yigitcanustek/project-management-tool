import { createSecureServer } from "http2";
import { readFileSync } from "fs";
import path from "path";

// Paths to SSL certificates (update paths accordingly)
const keyPath = path.join(
  import.meta.dirname + "/certs",
  "../certs/server.key"
);
const certPath = path.join(
  import.meta.dirname + "/certs",
  "../certs/server.crt"
);

// Read SSL certificate files
const options = {
  key: readFileSync(keyPath),
  cert: readFileSync(certPath),
};

// Create an HTTP/2 server
const server = createSecureServer(options, (req, res) => {
  const { method, url } = req;

  if (url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello, World! This is an HTTP/2 server.");
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

// Start the server
const PORT = 8443;
server.listen(PORT, () => {
  console.log(`HTTP/2 server is running on https://localhost:${PORT}`);
});
