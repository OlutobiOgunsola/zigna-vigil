const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function inventoryTransactions({ businessId, args }) {
  const params = {};
  if (args.transaction_type) params.transaction_type = args.transaction_type;
  if (args.item_id) params.item_id = args.item_id;

  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/inventory/transaction`,
    { params, headers: { 'x-gym-id': businessId } }
  );
  return data;
};
