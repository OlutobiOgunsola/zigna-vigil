const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function plansList({ businessId, args }) {
  const params = {};
  if (args.status) params.status = args.status;

  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/plan`,
    { params, headers: { 'x-gym-id': businessId } }
  );
  return data;
};
