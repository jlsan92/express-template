const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const debug = require('debug');
const winston = require('winston');
const expressWinston = require('express-winston');

const httpStatus = require('http-status');
const Joi = require('joi');
const Boom = require('boom');

const aws = require('aws-sdk');
const cote = require('cote');

Promise = require('bluebird'); // eslint-disable-line no-global-assign

const { Router } = express;

const statics = require('./src/config/statics.json');
const { env, port, jwtSecret } = require('./src/config')({ Joi, statics, debug });

const { environments } = statics;

const app = express();

if (env === environments.development) {
  app.use(morgan('dev'));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(helmet());

app.use(cors());

if (env === environments.development) {
  expressWinston.requestWhitelist.push('body');
  expressWinston.responseWhitelist.push('body');
  app.use(expressWinston.logger({
    transports: [
      new (winston.transports.Console)({
        json: true,
        colorize: true
      })
    ],
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
    colorStatus: true,
  }));
}

app.use('/api');

app.use((req, res, next) => next(Boom.notFound('not found')));

if (env !== environments.test) {
  app.use(expressWinston.errorLogger({
    transports: [
      new (winston.transports.Console)({
        json: true,
        colorize: true
      })
    ]
  }));
}

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const isLogicError = e => e.isBoom;
  const isControllerError = e => e.isJoi;

  if (isLogicError(err)) {
    return res.status(err.output.statusCode).json(err.output.payload);
  }
  if (isControllerError(err)) {
    const { details } = err;
    const message = details.length - 1 ?
      details.map(e => e.message) :
      details[0].message;

    return res.status(httpStatus.BAD_REQUEST).json({ message });
  }

  console.error(err); // eslint-disable-line no-console
  return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(err);
});

// TODO DB config

app.listen(port, () => {
  console.info(`server started on port ${port} (${env})`); // eslint-disable-line no-console
});

