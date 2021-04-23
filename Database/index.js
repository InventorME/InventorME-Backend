let AWS = require('aws-sdk');
var mysql2 = require('mysql2/promise');

exports.handler = async (event) => {
    //var uID = 1;
    // console.log(`event: ${JSON.stringify(event)}`);

    let response = {};

    // console.log("Starting query...");

    // console.log("IAM auth");

    var signer = new AWS.RDS.Signer({
        region: process.env['region'],
        hostname: process.env['proxyendpoint'],
        port: parseInt(process.env['port'], 10),
        username: process.env['user']
    });

    let token = signer.getAuthToken({
        username: process.env['user']
    });

    // console.log("IAM Token obtained");

    const connectionConfig = {
        host: process.env['proxyendpoint'],
        user: process.env['user'],
        database: process.env['database'],
        ssl: { rejectUnauthorized: false },
        password: token,
        authSwitchHandler: function ({ pluginName, pluginData }, cb) {
            // console.log("Setting new auth handler.");
        }
    };

    // Adding the mysql_clear_password handler
    connectionConfig.authSwitchHandler = (data, cb) => {
        if (data.pluginName === 'mysql_clear_password') {
            // See https://dev.mysql.com/doc/internals/en/clear-text-authentication.html
            // console.log("pluginName: " + data.pluginName);
            let password = token + '\0';
            let buffer = Buffer.from(password);
            cb(null, password);
        }
    };

    let connection;

    try {
        connection = await mysql2.createConnection(connectionConfig);
    } catch (err) {
        console.error('error connecting to the database');
        console.error(err);
        response = {
            statusCode: 500,
            "headers": {
                "Content-Type": "application/json"
            },
            body: 'error connecting to the database'
        };
        return response;
    }

    console.log(`connected as id ${connection.threadId}`);

    try {
        var bod = JSON.parse(event.body);
        if (event.httpMethod == "GET") {
            const [items, fields] = await connection.execute('SELECT * FROM im_items where userEmail = ' + event.queryStringParameters.userEmail);
            // console.log(`rows: ${JSON.stringify(rows)}`);
            // console.log(`fields: ${JSON.stringify(fields)}`);
            var responseBody = {
                items
            }
            response = {
                statusCode: 200,
                "headers": {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(responseBody)
            };
        }
        else if (event.httpMethod == "POST") {
            // var bod = JSON.parse(event.body);
            var insert = "INSERT INTO `inventorme_db`.`im_items`(`userEmail`,`itemCategory`,`itemName`,";
            insert += "`itemPhotoURL`,`itemSerialNum`,`itemPurchaseAmount`,`itemWorth`,`itemReceiptPhotoURL`,";
            insert += "`itemManualURL`,`itemSellDate`,`itemBuyDate`,`itemLocation`,`itemNotes`,`itemSellAmount`,";
            insert += "`itemRecurringPaymentAmount`,`itemEbayURL`,`itemTags`,`itemArchived`,`itemFolder`) VALUES (";
            insert += bod.userEmail + ",";
            insert += bod.itemCategory + ",";
            insert += bod.itemName + ",";
            insert += bod.itemPhotoURL + ",";
            insert += bod.itemSerialNum + ",";
            insert += bod.itemPurchaseAmount + ",";
            insert += bod.itemWorth + ",";
            insert += bod.itemReceiptPhotoURL + ",";
            insert += bod.itemManualURL + ",";
            insert += bod.itemSellDate + ",";
            insert += bod.itemBuyDate + ",";
            insert += bod.itemLocation + ",";
            insert += bod.itemNotes + ",";
            insert += bod.itemSellAmount + ",";
            insert += bod.itemRecurringPaymentAmount + ",";
            insert += bod.itemEbayURL + ",";
            insert += bod.itemTags + ",";
            insert += bod.itemArchived + ",";
            insert += bod.itemFolder + ")";
            await connection.execute(insert);
            const [id, fields] = await connection.execute("SELECT LAST_INSERT_ID()");
            var responseBody = {
                id
            }


            response = {
                statusCode: 200,
                "headers": {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(id)
            };
        }
        if (event.httpMethod == "PUT" && bod.itemID) {

            var insert = "UPDATE`inventorme_db`.`im_items` SET ";
            insert += "itemCategory =" + bod.itemCategory + ",";
            insert += "itemName =" + bod.itemName + ",";
            insert += "itemPhotoURL =" + bod.itemPhotoURL + ",";
            insert += "itemSerialNum =" + bod.itemSerialNum + ",";
            insert += "itemPurchaseAmount =" + bod.itemPurchaseAmount + ",";
            insert += "itemWorth =" + bod.itemWorth + ",";
            insert += "itemReceiptPhotoURL =" + bod.itemReceiptPhotoURL + ",";
            insert += "itemManualURL =" + bod.itemManualURL + ",";
            insert += "itemSellDate =" + bod.itemSellDate + ",";
            insert += "itemBuyDate =" + bod.itemBuyDate + ",";
            insert += "itemLocation =" + bod.itemLocation + ",";
            insert += "itemNotes =" + bod.itemNotes + ",";
            insert += "itemSellAmount =" + bod.itemSellAmount + ",";
            insert += "itemRecurringPaymentAmount =" + bod.itemRecurringPaymentAmount + ",";
            insert += "itemEbayURL =" + bod.itemEbayURL + ",";
            insert += "itemTags =" + bod.itemTags + ",";
            insert += "itemArchived =" + bod.itemArchived + ",";
            insert += "itemFolder =" + bod.itemFolder;
            insert += "WHERE itemID =" + bod.itemID;
            await connection.execute(insert);



            response = {
                statusCode: 200,
                "headers": {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(insert)
            };
        }
        if (event.httpMethod == "DELETE" && bod.itemID) {
            var query = "DELETE FROM `inventorme_db`.`im_items` WHERE itemID = " + bod.itemID;
            await connection.execute(query);
            response = {
                statusCode: 200,
                "headers": {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(query)
            };
        }
        else if (event.httpMethod == "DELETE" && bod.userEmail) {
            var query = "DELETE FROM `inventorme_db`.`im_items` WHERE userEmail = " + bod.userEmail;
            await connection.execute(query);
            response = {
                statusCode: 200,
                "headers": {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(query)
            };
        }
    } catch (err) {
        console.error('error running query');
        console.error(err);
        response = {
            statusCode: 500,
            "headers": {
                "Content-Type": "application/json"
            },
            body: 'error executing query'
        };
    }

    await connection.end();

    return response;
};