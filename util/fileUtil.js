const fs = require('fs');

const FileUtil = {
    async readdir(path) {
        return new Promise((resolve, reject) => {
            fs.readdir(path, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(files);
                }
            }) 
        })
        
    },

    async readfile(path) {
        return new Promise((resolve, reject) => {
            fs.readFile(path, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            })
        })
    }
}

module.exports = FileUtil;