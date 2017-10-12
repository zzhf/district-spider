const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');

const indexUrl = 'http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/';
const filePath = __dirname + '/json/districtcode/';

const spider = {
    getData() {
        request(indexUrl, (err, res, body) => {
            if (!err && res.statusCode == 200) {
                let $ = cheerio.load(body);
                let lastUrl = $('.center_list_contlist>li>a').attr('href');
                request(lastUrl, (err, res, body) => {
                    let $ = cheerio.load(body);
                    $('.provincetr>td>a').each((i, e) => {
                        let $e = $(e);
                        let proviceName = $e.text();
                        let url = lastUrl.substring(0, lastUrl.lastIndexOf('\/') + 1) + $e.attr('href');
                        request(url, (err, res, body) => {
                            let $ = cheerio.load(body);
                        })
                    })
                })
            }
        })
    }
}

spider.getData();