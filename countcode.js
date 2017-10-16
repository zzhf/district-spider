const cheerio = require('cheerio');
const request = require('request');
const Iconv = require('iconv-lite');
const fs = require('fs');

const indexUrl = 'http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/';
const filePath = __dirname + '/json/statcode/';
const failFilePath = __dirname + '/json/statcode/failUrl.log';

const failFileStream = fs.createWriteStream(failFilePath);

const Ajax = (()=>{
    let startCount = 0;
    let endCount = 0;
    let errorCount = 0;

    let _get = async (url) => {
        return new Promise((resolve, reject) => {
            request({url: url, encoding: null, timeout: 5000}, (err, res, body) => {
                endCount ++;
                console.log('请求' + url.replace(indexUrl, '') + '---' + (new Date()).toLocaleTimeString());
                if (err) {
                    errorCount ++;
                    failFileStream.write(url + '获取失败' + err + '\n');
                    reject(err);
                }
                if (!err && res.statusCode == 200) {
                    let $ =  cheerio.load(Iconv.decode(body, 'gb2312').toString());
                    resolve($);
                }
            })
        })
    };

    (() => {
        setInterval(() => {
            console.log('请求' + startCount + '次! 已完成' + endCount + '次，失败' + errorCount + '次');
        }, 1000)
    })()

    return {
        async get(url, callback) {
            startCount++;
            return await _get(url, callback);
        }
    }    
})();

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

        try{
            index$ = await Ajax.get(indexUrl);
        } catch (err) {
            console.error(err);
        }
        
        lastUrl = index$('.center_list_contlist>li>a').attr('href');
        try {
            provice$ = await Ajax.get(lastUrl);
        } catch (err) {
            console.log('获取省份数据失败');
            console.error(err);
        }
        
        proviceData = provice$('.provincetr>td>a');
        for(let i = 0, len = proviceData.length; i < len; i++) {
            try {
                let $proviceItem = proviceData.eq(i);
                let proviceName = $proviceItem.text();
                let proviceUrl = lastUrl.substring(0, lastUrl.lastIndexOf('\/') + 1) + $proviceItem.attr('href');
                let writeStream = fs.createWriteStream(filePath+proviceName + ".json");
                city$ = await Ajax.get(proviceUrl);
                let cityData = city$('.citytr');
                for(let j = 0, cityLen = cityData.length; j < cityLen; j++) {
                    try {
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
                        county$ = await Ajax.get(cityUrl);
                        let countyData = county$('.countytr');
                        for (let k = 0, countyLen = countyData.length; k < countyLen; k++) {
                            try {
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
                                    town$ = await Ajax.get(countyUrl); 
                                    let townData = town$('.towntr');
                                    for (let m = 0, townLen = townData.length; m < townLen; m++) {
                                        try {
                                            let townItem = townData.eq(m);
                                            code = townItem.find('td:first-child a').text();
                                            name = townItem.find('td:last-child a').text();
                                            let townUrl = countyUrl.substring(0, countyUrl.lastIndexOf('\/') + 1) + townItem.find('td:first-child a').attr('href');
                                            writeStream.write(JSON.stringify({
                                                name: name,
                                                statcode: code
                                            }) + '\n');
                                            village$ = await Ajax.get(townUrl);
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
                                        } catch (err) {
                                            continue;
                                        }
                                        
                                    }
                                }                        
                            } catch (err) {
                                continue;
                            }
                        }
                    } catch (err) {
                        continue;
                    }
                }
            } catch (err) {
                continue;
            }
        }
    },
}

spider.getData();