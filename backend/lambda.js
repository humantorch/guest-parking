const serverlessExpress = require('@vendia/serverless-express');
const app = require('./index');

const handler = serverlessExpress({ app });

// 🛡️ Wrap Lambda to explicitly handle OPTIONS and ensure CORS for cold starts
exports.handler = async (event, context) => {
  const origin = event.headers?.origin || '*';

  // Handle preflight OPTIONS request
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: '',
    };
  }

  // 🧠 Proxy all other requests to Express (but still inject CORS)
  const response = await handler(event, context);
  response.headers = {
    ...response.headers,
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
  return response;
};
