// Initializes the `upload` service on path `/uploads`
const hooks = require('./uploads.hooks');
const BlobService = require('feathers-blob');
const multer = require('multer');
const store = require('s3-blob-store');
const AWS = require('aws-sdk');

module.exports = function (app) {
  const multipartMiddleware = multer();

  const spacesEndpoint = new AWS.Endpoint('sfo2.digitaloceanspaces.com');
  const s3 = new AWS.S3({
    accessKeyId: app.get('doSpacesAccessKey'),
    secretAccessKey: app.get('doSpacesSecretKey'),
    endpoint: spacesEndpoint
  });

  const blobStore = store({
    client: s3,
    bucket: 'angelthump/offline-screens/uploads'
  });


  // Initialize our service with any options it requires
  app.use('/uploads',
      multipartMiddleware.single('uri'),
      function(req,res,next){
          req.feathers.file = req.file;
          next();
      },
      BlobService({Model: blobStore})
  );

  const service = app.service('uploads');

  service.hooks(hooks);

};