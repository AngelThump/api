// streams-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'streams';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
    userId: {type: String, required: true},
    username: {type: String, required: true, unique: true},
    ingest: {type: Object, required: true},
    ip_address: {type: String},
    transcoding: {type: Boolean, required: true},
    transcodeReady: {type: Boolean, default: false},
    transcodeInputs: {type: Array, default: []},
    type: {type: String},
    viewer_count: {type: Number},
    thumbnail_url: {type: String},
    stream_key: {type: String, required: true},
    user: {type: Object}
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
