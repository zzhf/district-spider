const cheerio = require('cheerio');
const request = require('request');
const Iconv = require('iconv-lite');
const fs = require('fs');

const indexUrl = 'http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/';
const filePath = __dirname + '/json/statcode/';

const Ajax = (()=>{
    let startCount = 0;
    let endCount = 0;

    let _get = (url, callback) => {
        request({url: url, encoding: null}, (err, res, body) => {
            endCount ++;
            console.log('请求' + url + '---' + (new Date()).toLocaleTimeString());
            if (err) {
                console.error(err);
            }
            if (!err && res.statusCode == 200) {
                let $ =  cheerio.load(Iconv.decode(body, 'gb2312').toString());
                callback($);
            } else {
                // console.error(res);
            }
        })
    };

    (() => {
        setInterval(() => {
            console.log('请求' + startCount + '次! 已完成' + endCount + '次');
        }, 1000)
    })()

    return {
        get(url, callback) {
            startCount++;
            _get(url, callback);
        }
    }    
})();

const spider = {

    getData() {
        Ajax.get(indexUrl, ($) => {
            let lastUrl = $('.center_list_contlist>li>a').attr('href');
            Ajax.get(lastUrl, ($) => {
                this.getProviceData($, lastUrl);             
            })
        })
    },

    getCityData($, cityUrl) {
        let $city = $('.citytr');
        if (this.cityItem >= $city.length) {
            this.getProviceData
        }
    },

    getProviceData($, lastUrl) {
        let $provice = $('.provincetr>td>a');
        if (this.proviceItem >= $provice.length) {
            return;
        }
        let $e = $($provice[this.proviceItem]);
        let proviceName = $e.text();
        let url = lastUrl.substring(0, lastUrl.lastIndexOf('\/') + 1) + $e.attr('href');
        let writeStream = fs.createWriteStream(filePath+proviceName + ".json");
        Ajax.get(url, ($) => {
            let citys = $('.citytr');
            citys.each((i, e) => {
                let $e = $(e);
                let code = $e.find('td:first-child a').text();
                let name = $e.find('td:last-child a').text();
                let cityUrl =  url.substring(0, url.lastIndexOf('\/') + 1) + $e.find('td:first-child a').attr('href');
                if (writeStream) {
                    writeStream.write(JSON.stringify({
                        name: name,
                        statcode: code
                    }) + '\n');
                }
                Ajax.get(cityUrl, ($) => {
                    $('.countytr').each((i, e) => {
                        let $e = $(e);
                        let code = $e.find('td:first-child a').text();
                        let name = $e.find('td:last-child a').text();
                        let countyUrl = cityUrl.substring(0, cityUrl.lastIndexOf('\/') + 1) + $e.find('td:first-child a').attr('href');
                        if (!code && !name) {
                            code = $e.find('td:first-child').text();
                            name = $e.find('td:last-child').text();
                            countyUrl = null;
                        }
                        writeStream.write(JSON.stringify({
                            name: name,
                            statcode: code
                        }) + '\n');
                        if (countyUrl) {
                            Ajax.get(countyUrl, ($) => {
                                $('.towntr').each((i, e) => {
                                    let $e = $(e);
                                    let code = $e.find('td:first-child a').text();
                                    let name = $e.find('td:last-child a').text();
                                    let townUrl = countyUrl.substring(0, countyUrl.lastIndexOf('\/') + 1) + $e.find('td:first-child a').attr('href');
                                    writeStream.write(JSON.stringify({
                                        name: name,
                                        statcode: code
                                    }) + '\n');
                                    Ajax.get(townUrl, ($) => {
                                        $('.villagetr').each((i, e) => {
                                            let $e = $(e);
                                            let statCode = $($e.find('td')[0]).text();
                                            let countryCode = $($e.find('td')[1]).text();
                                            let name = $($e.find('td')[2]).text();
                                            writeStream.write(JSON.stringify({
                                                statCode: statCode,
                                                name: name,
                                                countryCode: countryCode
                                            }) + '\n');
                                        })
                                    })
                                })
                            })
                        }
                    })
                })
            })
            this.proviceItem ++;
            this.getProviceData($, lastUrl);
        })
    },


    spider(url, selector ,writeStream, callback) {
        request({
            url: url,
            encoding: null
        }, (err, res, body) => {
            if (!err && res.statusCode == 200) {
                let statCode, countryCode, name, data;
                let $ = cheerio.load(Iconv.decode(body, 'gb2312').toString());
                let $selector = $(selector);
                $selector.each((i, e) => {
                    let $e = $(e);
                    if ($selector.children().length == 2) {
                        statCode = $e.find('td:first-child a').text();
                        name = $e.find('td:last-child a').text();
                        data = {
                            statCode: statCode,
                            name: name
                        }
                    } else if ($selector.children().length == 3) {
                        statCode = $($e.children('a')[0]).text().trim();
                        countryCode = $($e.children('a')[1]).text().trim();
                        name = $($e.children('a')[2]).text().trim();
                        data = {
                            statCode: statCode,
                            name: name,
                            countryCode: countryCode
                        }
                    }
                    childUrl = url.substring(0, url.lastIndexOf('\/') + 1) + $e.attr('href');
                    if (writeStream) {
                        writeStream.write(JSON.stringify(data) + '\n');
                    }
                    callback(childUrl);
                })
                

            } else {
            }
        })
    }
}

spider.getData();