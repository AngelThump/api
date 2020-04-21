// streams-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'streams';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
    ingest: {type: Object, required: true},
    ip_address: {type: String, required: true},
    transcoding: {type: Boolean, required: true},
    type: {type: String},
    viewer_count: {type: Number},
    thumbnail_url: {type: String},
    stream_key: {type: String, required: true},
    user: {type: Object, required: true}
  }, {
    timestamps: true
  });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);
  
};
