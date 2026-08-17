const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function analyticsEquipment({ businessId, args }) {
  const params = {};
  if (args.from) params.from = args.from;
  if (args.to) params.to = args.to;

  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/equipment/analytics`,
    { params, headers: { 'x-gym-id': businessId } }
  );

  return data;
};
