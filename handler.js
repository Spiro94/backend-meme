'use strict';

const serverless = require('serverless-http');
const express = require('express');

const app = express();
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');

const MEMES = process.env.MEMES;
const IS_OFFLINE = process.env.IS_OFFLINE;

app.use(bodyParser.urlencoded({ extended: true }));

const dynamodb = IS_OFFLINE ? new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
}) : new AWS.DynamoDB.DocumentClient();

//POST GetMemes
app.post('/getMemes', (req, res) => {

    const { pageSize, id } = req.body;

    const params = {
        TableName: MEMES,
        Limit: pageSize,
    }

    if (id) {
        params.ExclusiveStartKey = {
            id,
        };
    }

    dynamodb.scan(params, (error, result) => {
        if (error) {
            console.log(error);
            res.status(400).json({
                success: false,
                message: error
            });
        } else {
            const { Items, LastEvaluatedKey } = result;

            res.json({
                success: true,
                message: 'ok',
                Items,
                LastEvaluatedKey: LastEvaluatedKey.id
            });
        }

    });

});


app.post('/memes', (req, res) => {

    const { title, imageUrl, category } = req.body;
    let secondsSinceEpoch = Math.round(Date.now() / 1000)
    let idVar = 'M' + secondsSinceEpoch;

    const params = {
        TableName: MEMES,
        Item: {
            id: idVar,
            title,
            imageUrl,
            createdAt: secondsSinceEpoch,
            category,
            upVote: 0,
            downVote: 0,
        },
    }

    dynamodb.put(params, (error, result) => {
        if (error) {
            console.log(error);
            res.status(400).json({
                success: false,
                message: error
            });
        } else {

            res.json({
                success: true,
                message: 'ok',
                item: params.Item
            });
        }

    });

});


//POST UpVote
app.post('/upVote', (req, res) => {

    const { id, title } = req.body;

    const params = {
        TableName: MEMES,
        Key: {
            id,
            title
        },
        UpdateExpression: "set upVote = upVote + :val",
        ExpressionAttributeValues: {
            ":val": 1
        },
        ReturnValues: "UPDATED_NEW"
    };

    dynamodb.update(params, (error, result) => {
        if (error) {
            console.log(error);
            return res.status(400).json({
                success: false,
                message: error
            });
        }

        return res.json({
            success: true,
            message: 'ok',
            result: result
        });
    });

});

//POST downVote
app.post('/downVote', (req, res) => {

    const { id, title } = req.body;

    const params = {
        TableName: MEMES,
        Key: {
            id,
            title
        },
        UpdateExpression: "set downVote = downVote + :val",
        ExpressionAttributeValues: {
            ":val": 1
        },
        ReturnValues: "UPDATED_NEW"
    };

    dynamodb.update(params, (error, result) => {
        if (error) {
            console.log(error);
            return res.status(400).json({
                success: false,
                message: error
            });
        }

        return res.json({
            success: true,
            message: 'ok',
            result: result
        });
    });

});


module.exports.memes = serverless(app);