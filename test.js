const cheerio = require('cheerio');
const request = require('request');
const Iconv = require('iconv-lite');
const fs = require('fs');

const indexUrl = 'http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/';
const filePath = __dirname + '/json/statcode/';

// const Ajax = (()=>{
//     let startCount = 0;
//     let endCount = 0;

//     let _get = async (url) => {
//         return new Promise((resolve, reject) => {
//             request({url: url, encoding: null}, (err, res, body) => {
//                 endCount ++;
//                 console.log('请求' + url + '---' + (new Date()).toLocaleTimeString());
//                 if (err) {
//                     console.error(err);
//                     reject(err);
//                 }
//                 if (!err && res.statusCode == 200) {
//                     let $ =  cheerio.load(Iconv.decode(body, 'gb2312').toString());
//                     resolve($);
//                 } else {
//                     // console.error(res);
//                 }
//             })
//         })
//     };

//     (() => {
//         setInterval(() => {
//             console.log('请求' + startCount + '次! 已完成' + endCount + '次');
//         }, 1000)
//     })()

//     return {
//         async get(url, callback) {
//             startCount++;
//             await _get(url, callback);
//         }
//     }    
// })();

const Ajax = {
    async get(url) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                request({url: url, encoding: null}, (err, res, body) => {
                    console.log('请求'+ url.replace(indexUrl, '') + '-' +(new Date()).toLocaleTimeString());
                    if (err) {
                        console.error(err);
                        reject(err);
                    }
                    if (!err && res.statusCode == 200) {
                        let $ =  cheerio.load(Iconv.decode(body, 'gb2312').toString());
                        resolve($);
                    }
                })                
            }, 500)

        })
    }
}

const spider = {

    async getData() {
        let index$, //首页dom
            provice$, //省份页dom
            city$,  //城市页dom
            county$,  //县级市页dom
            town$,  //乡镇页dom
            village$,  //村、村委会页dom
            code,  //统计用代码
            name,  //名称
            proviceData,
            lastUrl;

        index$ = await Ajax.get(indexUrl);
        lastUrl = index$('.center_list_contlist>li>a').attr('href');
        provice$ = await Ajax.get(lastUrl);
        proviceData = provice$('.provincetr>td>a');
        for(let i = 0, len = proviceData.length; i < len; i++) {
            console.log(len);
            let $proviceItem = proviceData.eq(i);
            let proviceName = $proviceItem.text();
            let proviceUrl = lastUrl.substring(0, lastUrl.lastIndexOf('\/') + 1) + $proviceItem.attr('href');
            let writeStream = fs.createWriteStream(filePath+proviceName + ".json");
            try {
                city$ = await Ajax.get(proviceUrl);
            } catch (err) {
                console.log(err);
                continue;
            }
            
            let cityData = city$('.citytr');
            for(let j = 0, cityLen = cityData.length; j < cityLen; j++) {
                let cityItem = cityData.eq(j);
                code = cityItem.find('td:first-child a').text();
                name = cityItem.find('td:last-child a').text();
                let cityUrl =  proviceUrl.substring(0, proviceUrl.lastIndexOf('\/') + 1) + cityItem.find('td:first-child a').attr('href');
                if (writeStream) {
                    writeStream.write(JSON.stringify({
                        name: name,
                        statcode: code
                    }) + '\n');
                }
                try {
                    county$ = await Ajax.get(cityUrl);
                } catch (err) {
                    console.log(err);
                    continue;
                }
                
                let countyData = county$('.countytr');
                for (let k = 0, countyLen = countyData.length; k < countyLen; k++) {
                    let countyItem = countyData.eq(k);
                    code = countyItem.find('td:first-child a').text();
                    name = countyItem.find('td:last-child a').text();
                    // console.log(code + '---' + name);
                    let countyUrl = cityUrl.substring(0, cityUrl.lastIndexOf('\/') + 1) + countyItem.find('td:first-child a').attr('href');
                    if (!code && !name) {
                        code = countyItem.find('td:first-child').text();
                        name = countyItem.find('td:last-child').text();
                        countyUrl = null;
                    }
                    writeStream.write(JSON.stringify({
                        name: name,
                        statcode: code
                    }) + '\n');
                    if (countyUrl) {
                        try {
                           town$ = await Ajax.get(countyUrl); 
                        } catch (err) {
                            console.log(err);
                            continue;
                        }
                        
                        let townData = town$('.towntr');
                        for (let m = 0, townLen = townData.length; m < townLen; m++) {
                            let townItem = townData.eq(m);
                            code = townItem.find('td:first-child a').text();
                            name = townItem.find('td:last-child a').text();
                            let townUrl = countyUrl.substring(0, countyUrl.lastIndexOf('\/') + 1) + townItem.find('td:first-child a').attr('href');
                            writeStream.write(JSON.stringify({
                                name: name,
                                statcode: code
                            }) + '\n');
                            try {
                                village$ = await Ajax.get(townUrl);
                            } catch (err) {
                                console.log(err);
                                continue;
                            }
                            let villageData = village$('.villagetr');
                            for (let n = 0, villageLen = villageData.length; n < villageLen; n++) {
                                let villageItem = villageData.eq(n);
                                code = villageItem.find('td').eq(0).text();
                                name = villageItem.find('td').eq(2).text();
                                writeStream.write(JSON.stringify({
                                    name: name,
                                    statcode: code
                                }) + '\n');
                            } 
                        }
                    }
                }
            }
        }
    },
}

spider.getData();