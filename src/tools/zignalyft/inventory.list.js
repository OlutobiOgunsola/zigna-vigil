const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function inventoryList({ businessId, args }) {
  const params = {};
  if (args.category) params.category = args.category;
  if (args.low_stock) params.low_stock = args.low_stock;

  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/inventory`,
    { params, headers: { 'x-gym-id': businessId } }
  );
  return data;
};
