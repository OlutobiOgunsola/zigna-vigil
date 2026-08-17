const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function equipmentList({ businessId, args }) {
  const params = {};
  if (args.status) params.status = args.status;
  if (args.category) params.category = args.category;

  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/equipment`,
    { params, headers: { 'x-gym-id': businessId } }
  );
  return data;
};
