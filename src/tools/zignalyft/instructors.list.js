const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function instructorsList({ businessId }) {
  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/instructor`,
    { headers: { 'x-gym-id': businessId } }
  );
  return data;
};
