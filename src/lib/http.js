/**
 * Shared axios instance for all Vigil → product API requests.
 *
 * Every outbound request carries a short-lived JWT (60 s) signed with
 * VIGIL_SECRET in the x-vigil-secret header. Product APIs verify the
 * signature and expiry before accepting — a captured token can't be
 * replayed after it expires.
 *
 * Product-specific headers (x-gym-id, x-hotel-id) are still set
 * per-request by callers.
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('../config/environment');

const productApi = axios.create({ timeout: 15000 });

// Sign a fresh JWT for every outbound request
productApi.interceptors.request.use(request => {
  const token = jwt.sign(
    { iss: 'zigna-vigil', iat: Math.floor(Date.now() / 1000) },
    config.vigilSecret,
    { expiresIn: '60s' }
  );

  request.headers['x-vigil-secret'] = token;
  if (!request.headers['Content-Type']) {
    request.headers['Content-Type'] = 'application/json';
  }

  return request;
});

module.exports = productApi;
