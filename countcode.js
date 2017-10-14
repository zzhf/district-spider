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
        setTimeout(() => {
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
        }, 500)
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
            // this.getProviceData
        }
    },

    getProviceData($, lastUrl) {
        let that = this;
        let $provice = $('.provincetr>td>a');
        $provice.each((i, e) => {
            let $e = $(e);
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
                        that.recursionCounty.getCounty($('.countytr'), null, cityUrl, writeStream);
                    })
                })
            })
        })
    },

    recursionCounty: (function() {
        let count = 0;
        let _$county;
        let _callback;
        let that = this;
        let _cityUrl;
        let _writeStream;

        return {
            getCounty($county, callback, cityUrl, writeStream) {
                console.log('县级计数器' + count);
                _$county = $county || _$county;
                _callback = callback || _callback;
                _cityUrl = cityUrl || _cityUrl;
                _writeStream = writeStream || _writeStream;

                let $e = _$county.eq(count);
                let code = $e.find('td:first-child a').text();
                let name = $e.find('td:last-child a').text();
                let countyUrl = _cityUrl.substring(0, _cityUrl.lastIndexOf('\/') + 1) + $e.find('td:first-child a').attr('href');
                if (!code && !name) {
                    code = $e.find('td:first-child').text();
                    name = $e.find('td:last-child').text();
                    countyUrl = null;
                    count ++;
                    spider.recursionCounty.getCounty();
                }
                _writeStream.write(JSON.stringify({
                    name: name,
                    statcode: code
                }) + '\n');
                if (countyUrl) {
                    Ajax.get(countyUrl, ($) => {
                        spider.recursionTown($('.towntr'), () => {
                            count ++;
                            spider.recursionCounty.getCounty();
                        }, countyUrl, _writeStream);
                    })
                }
            }
        }
    })(),

    recursionCity: (function() {
        let count = 0;

        return {
            getCity($city, callback) {
                console.log('城市计数器' + count)
                if (count >= $city.length) {
                    count = 0;
                    callback();
                    return;
                }
                let $e = $($city[count]);
            }
        }
    })(),

    recursionTown: (function() {
        let count = 0;
        let _callback;
        let _countryUrl;
        let that = this;

        return {
            getTown($town, callback, countryUrl, writeStream) {
                console.log('乡镇计数器' + count);
                _callback = callback || _callback;
                _countryUrl = countyUrl || _countryUrl;
                _writeStream = writeStream || _writeStream;

                if (count >= $town.length) {
                    count = 0;
                    _callback();
                    return;
                }
                let $e = $town.eq(count);
                let code = $e.find('td:first-child a').text();
                let name = $e.find('td:last-child a').text();
                let townUrl = _countryUrl.substring(0, _countryUrl.lastIndexOf('\/') + 1) + $e.find('td:first-child a').attr('href');
                _writeStream.write(JSON.stringify({
                    name: name,
                    statcode: code
                }) + '\n');
                Ajax.get(townUrl, ($) => {
                    $('.villagetr').each((i, e) => {
                        let $e = $(e);
                        let statCode = $($e.find('td')[0]).text();
                        let countryCode = $($e.find('td')[1]).text();
                        let name = $($e.find('td')[2]).text();
                        _writeStream.write(JSON.stringify({
                            statCode: statCode,
                            name: name,
                            countryCode: countryCode
                        }) + '\n');
                    })
                    spider.recursionTown.getTown($town);
                })
                count ++;
            }
        }
    })(),

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