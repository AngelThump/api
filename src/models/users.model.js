'use strict';

// users-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function(app) {
  const mongooseClient = app.get('mongooseClient')
  
  const users = new mongooseClient.Schema({
    banned:    {type: Boolean, 'default': false},
    transcode: {type: Boolean, 'default': false},
    playerTranscodeReady: {type:Boolean, 'default': false},
    title: {type: String},
    live: {type: Boolean, 'default': false},
    streamCreatedAt: {type: Date, 'default': Date.now },
    streamUpdatedAt: {type: Date, 'default': Date.now },
    patreonID: {type: String},
    isPatron: {type: Boolean},
    patronTier: {type: Number},
    ingestServer: {type: String},
    ip_address: {type: String}
  });

  return mongooseClient.model('users', users);
};
