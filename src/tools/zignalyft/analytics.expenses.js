const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function analyticsExpenses({ businessId, args }) {
  const params = {};
  if (args.from) params.from = args.from;
  if (args.to) params.to = args.to;

  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/expense/analytics`,
    { params, headers: { 'x-gym-id': businessId } }
  );

  return data;
};
