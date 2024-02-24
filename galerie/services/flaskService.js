const http = require('http');

module.exports.sendImagesDBService = (imageDetails) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();

    // Assuming 'imageDetails' is an array of objects containing file information
    for (let image of imageDetails) {
      formData.append('files', image.file, { filename: image.filename });
      formData.append('contentType', image.contentType);
    }

    const options = {
      hostname: 'localhost', // Replace with your Flask API hostname
      port: 5000, // Replace with your Flask API port
      path: '/album/process', // Replace with your Flask API endpoint
      method: 'POST',
      headers: formData.getHeaders(), // Get headers from FormData
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const responseData = JSON.parse(data);
          resolve(responseData);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    formData.pipe(req); // Send FormData as the request body
  });
};
