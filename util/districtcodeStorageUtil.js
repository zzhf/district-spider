const db = require('./../mongodb/db');
const FileUtil = require('./fileUtil');
const DistrictCodeModal = require('./../models/districtCode');
const StatCodeModal = require('./../models/statCode');

const districtFilePath = './../json/districtcode';
const statFilePath = './../json/statcode';

// const Storage = {
//     startCount: 0,
//     endCount: 0,
//     errorCount: 0,
//     async storageDistrictCode() {
//         this._storage(districtFilePath, DistrictCodeModal);
//     },
//     async storageStatCode() {
//         this._storage(statFilePath, StatCodeModal);
//     },
//     async _storage(foldPath, construct) {
//         try {
//             let files = await FileUtil.readdir(foldPath);
//             let fileData;
//             let fileArr;
//             for (let i = 0, len = files.length; i < len; i ++) {
//                 if (!/\.json$/.test(files[i])) {
//                     continue;
//                 }
//                 fileData = await FileUtil.readfile(foldPath + '/' +files[i]);
//                 fileArr = fileData.split('\n');
//                 for (let j = 0, itemLen = fileArr.length; j < itemLen; j++) {
//                     if (fileArr[j] && fileArr[j].trim()) {
//                         let item = new construct(JSON.parse(fileArr[j])); 
//                         this.startCount ++;
//                         item.save((err) => {
//                             if (err) {
//                                 this.errorCount ++;
//                                 console.log(item + '入库失败！失败原因:' + err);
//                             } else {
//                                 this.endCount ++;
//                                 // console.log(item.name + '入库成功！');
//                             }
//                         });
//                     }
//                 }
//             }
//         } catch (e) {
//             console.log(e);
//         }
//     }
// }

const Storage = (() => {
    let _startCount = 0;
    let _endCount = 0;
    let _errorCount = 0;
    let _startTime = Date.now();

    let _storage = async (foldPath, construct) => {
        try {
            let files = await FileUtil.readdir(foldPath);
            let fileData;
            let fileArr;
            for (let i = 0, len = files.length; i < len; i ++) {
                if (!/\.json$/.test(files[i])) {
                    continue;
                }
                fileData = await FileUtil.readfile(foldPath + '/' +files[i]);
                fileArr = fileData.split('\n');
                for (let j = 0, itemLen = fileArr.length; j < itemLen; j++) {
                    if (fileArr[j] && fileArr[j].trim()) {
                        _startCount ++;
                        // console.log(construct);
                        let item = new construct(JSON.parse(fileArr[j])); 
                        item.save((err) => {
                            if (err) {
                                _errorCount ++;
                                console.log(item + '入库失败！失败原因:' + err);
                            } else {
                                _endCount ++;
                                // console.log(item.name + '入库成功！');
                            }
                        });
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
    }

    (() => {
        setInterval(() => {
            console.log('解析' + _startCount + '条数据! 已完成' + _endCount + '条数据入库，' +
                '失败' + _errorCount + '条。已花费时间'+ (Date.now() - _startTime)) / (1000 * 60) + 'min';
        }, 2000)
    })()

    return {
        storageDistrictCode() {
            _storage(districtFilePath, DistrictCodeModal);
        },
        storageStatCode() {
            try {
                _storage(statFilePath, StatCodeModal);
            } catch (e) {
                console.log(e);
            }
            
        },
    }

})();


Storage.storageStatCode();