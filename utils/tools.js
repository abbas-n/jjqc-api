const request = require('request');
const { dbCon, mysql } = require("../config/dbConnection");
const { urlencoded } = require('express');
const dotenv = require("dotenv").config();
const axios = require('axios');
module.exports = {
    is_number: (input) => {
        if (input === '')
            return false;
        let regex = new RegExp(/[^0-9]/, 'g');
        return (input.match(regex) === null);
    },

    is_mobile: (input) => {
        if (input.charAt(0) == "0" && input.charAt(1) == "9" && input.length == 11) {
            return true;
        }
    },

    is_string: (input) => {
        if (typeof input === 'string' && input.trim() !== '') {
            return true;
        }
        return false;
    },

    escapeHtml: (string) => {
        // var entityMap = {
        //     '&': '&amp;',
        //     '<': '&lt;',
        //     '>': '&gt;',
        //     '"': '&quot;',
        //     "'": '&#39;',
        //     '/': '&#x2F;',
        //     '`': '&#x60;',
        //     '=': '&#x3D;'
        // };
        var entityMap = {
            '&': '',
            '<': '',
            '>': '',
            '"': '',
            "'": '',
            '/': '',
            '`': '',
            '=': ''
        };
        return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) {
            return entityMap[s];
        });
    },

    rand_numcode: (length) => {
        let result = '';
        const characters = '0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }
        return result;
    },

    generateUniqueCode: async (tableName, columnName, length, start = '') => {
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length) - 1;
        let code = Math.floor(Math.random() * (max - min + 1)) + min;
        code = String(start) + String(code);
        const statement = `SELECT COUNT(*) AS count FROM ${tableName} WHERE ${columnName} = ?`;
        const query = mysql.format(statement, [code]);

        const result = await new Promise((resolve, reject) => {
            dbCon.query(query, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        const count = result[0].count;

        if (count === 0) {
            return code;
        } else {
            module.exports.generateUniqueCode(tableName, columnName, length); // Retry if the code already exists
        }
    },

    nowTimeDif_min: async (time) => {
        const currentTime = new Date().getTime();
        var difference = currentTime - time;
        return Math.floor(difference / 1000 / 60);
    },

    post_request: async (url, headers = '', body) => {
        var options = {
            'method': 'POST',
            'url': url,
            'headers': headers,
            body: body

        };

        var rs = await new Promise((resolve, reject) => {
            request(options, function (error, response) {
                if (error) throw new Error(error);
                resolve(response.body);
            });
        });
        return rs;
    },
    post_request_formData: async (url, headers = '', formData) => {
        var options = {
            'method': 'POST',
            'url': url,
            'headers': headers,
            formData: formData

        };

        var rs = await new Promise((resolve, reject) => {
            request(options, function (error, response) {
                if (error) throw new Error(error);
                resolve(response.body);
            });
        });
        return rs;
    },
    get_request: async (url, headers = '') => {
        var options = {
            'method': 'GET',
            'url': url,
            'headers': headers

        };

        var rs = await new Promise((resolve, reject) => {
            request(options, function (error, response) {
                if (error) throw new Error(error);
                resolve(response.body);
            });
        });
        return rs;
    },

    getSMS_ir_token: async () => {
        const tokenBody = JSON.stringify({
            "UserApiKey": "b25636d15e246255e16a4186",
            "SecretKey": "dfgdh34544ed"
        });
        const headers = { 'Content-Type': 'application/json' };
        var smsToken = await module.exports.post_request('https://RestfulSms.com/api/Token', headers, tokenBody);
        smsToken = JSON.parse(smsToken);
        return smsToken.TokenKey;
    },

    sendSMS_ir: async (msg, mobiles) => {
        // const token = await module.exports.getSMS_ir_token();
        // const body = JSON.stringify({
        //     "Messages": [
        //         msg
        //     ],
        //     "MobileNumbers": [
        //         mobiles
        //     ],
        //     "LineNumber": "3000476284",
        //     "SendDateTime": "",
        //     "CanContinueInCaseOfError": "false"
        // });

        // const headers = { 'Content-Type': 'application/json', 'x-sms-ir-secure-token': token };
        // var rs = await module.exports.post_request('https://RestfulSms.com/api/MessageSend', headers, body);
        // console.log(rs);
        // // var rs = JSON.stringify({ 'IsSuccessful': true });
        // return rs;


        // var Kavenegar = require('kavenegar');
        // var api = Kavenegar.KavenegarApi({
        //     apikey: '694B79636B51794A4E724C56796F7A2F5A383455796265516E5941535446697A'
        // });
        // var statusRS = 0;


        // let rs = await new Promise((resolve, reject) => {
        //     api.VerifyLookup({
        //         receptor: mobiles,
        //         token: msg,
        //         template: "hrmbai"
        //     }, function (response, status) {
        //         // console.log(response);
        //         // console.log(status);
        //         if (0) reject(err);
        //         else resolve(status);
        //     });
        // });
        // return rs;

        let needUrl = `${process.env.candoosmsURL}username=${process.env.candoosmsUser}&password=${process.env.candoosmsPass}&command=send&src=982184650&destinations=${mobiles}&body=${msg}&flash=0`;
        console.log(needUrl)
        try {
            const response = await axios.get(needUrl);
            const match = response.data.match(/ID:(\d+)/);
            if (match && match[1] > 0) {
                return 1;
            } else {
                return 0;
            }
        } catch (error) {
            console.error(error);
            throw new Error('Error occurred during the request');
        }
    },
}

