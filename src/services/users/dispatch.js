/* eslint-disable require-atomic-updates */
module.exports = function () { // eslint-disable-line no-unused-vars
    return async context => {
        if(context.method === 'find') {
            context.dispatch = context.result;
            let index=0;
            for(let data of context.dispatch.data) {
                const keys = ['email', 'stream_key', 'stream_password', 'bans', 'resetExpires', 'patreon.id', 'twitch.id', 'patreon.access_token', 'patreon.refresh_token', 'twitch.access_token', 'twitch.refresh_token', 'verifyToken', 'verifyShortToken', 'resetToken', 'resetShortToken', 'verifyChanges', 'resetExpired', 'verifyExpires']

                for(let key of keys) {
                    if(key.includes('.')) {
                        key = key.split('.');
                        if(data[key[0]]) {
                            delete data[key[0]][key[1]];
                        }
                    } else {
                        delete data[key];
                    }
                }
                context.dispatch.data[index] = data;
                index++;
            }
            return context;
        } else {
            let dispatch = context.result;
            let keys;
            if(context.params.user) {
                if(context.params.user.id !== dispatch.id) {
                    keys = ['email', 'stream_key', 'stream_password', 'bans', 'resetExpires', 'patreon.id', 'twitch.id', 'patreon.access_token', 'patreon.refresh_token', 'twitch.access_token', 'twitch.refresh_token', 'verifyToken', 'verifyShortToken', 'resetToken', 'resetShortToken', 'verifyChanges', 'resetExpired', 'verifyExpires']
                } else {
                    keys = ['bans', 'resetExpires', 'patreon.id', 'twitch.id', 'patreon.access_token', 'patreon.refresh_token', 'twitch.access_token', 'twitch.refresh_token', 'verifyToken', 'verifyShortToken', 'resetToken', 'resetShortToken', 'verifyChanges', 'resetExpired', 'verifyExpires']
                }
            } else {
                keys = ['email', 'stream_key', 'stream_password', 'bans', 'resetExpires', 'patreon.id', 'twitch.id', 'patreon.access_token', 'patreon.refresh_token', 'twitch.access_token', 'twitch.refresh_token', 'verifyToken', 'verifyShortToken', 'resetToken', 'resetShortToken', 'verifyChanges', 'resetExpired', 'verifyExpires']
            }

            for(let key of keys) {
                if(key.includes('.')) {
                    key = key.split('.');
                    if(dispatch[key[0]]) {
                        delete dispatch[key[0]][key[1]];
                    }
                } else {
                    delete dispatch[key];
                }
            }
            context.dispatch = dispatch;
        }
    };
};