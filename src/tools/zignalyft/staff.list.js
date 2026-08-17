const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function staffList({ businessId }) {
  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/staff`,
    { headers: { 'x-gym-id': businessId } }
  );
  return data;
};
