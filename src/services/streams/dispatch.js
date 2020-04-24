/* eslint-disable require-atomic-updates */
module.exports = function () { // eslint-disable-line no-unused-vars
    return async context => {
        if(context.method === 'find') {
            if(typeof context.result[Symbol.iterator] !== 'function') {
                return context;
            }
    
            context.dispatch = context.result;
            let index=0;
            for(let data of context.dispatch) {
                const keys = ['stream_key', 'ip_address']

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
                context.dispatch[index] = data;
                index++;
            }
            return context;
        } else {
            let dispatch = context.result;
            const keys = ['stream_key', 'ip_address']

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