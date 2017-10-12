const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');

const indexUrl = 'http://www.stats.gov.cn/tjsj/tjbz/xzqhdm/';
const filePath = __dirname + '/json/districtcode/';

const spider = {
    getLastUrl() {
        request(indexUrl, (err, res, body) => {
            if (!err && res.statusCode == 200) {
                let $ = cheerio.load(body);
                let lastUrl = indexUrl + $('.center_list_contlist>li:first-child>a').attr('href').replace(/^.\//, '');
                request(lastUrl, (err, res, body) => {
                    if (!err && res.statusCode == 200) {
                        let code, name, fileName, writeStream,
                            $ = cheerio.load(body);

                        $('p.MsoNormal').each((i, e) => {
                            let $e = $(e);
                            if ($e.children('b').length) {
                                code = $e.find('span[lang="EN-US"]').text().trim();
                                name = $e.find('>b:last-child>span').text().trim();
                                fileName = code + name + '.json';
                                writeStream = fs.createWriteStream(filePath + fileName);
                            } else {
                                code = $e.find('span[lang="EN-US"]').text().trim();
                                name = $e.find('span:last-child').text().trim();
                            }
                            if (writeStream) {
                                    writeStream.write(JSON.stringify({
                                    name: name,
                                    code: code
                                }) + '\n')
                            }
                        })
                    }
                })
            }
        })
    },
}

spider.getLastUrl();
