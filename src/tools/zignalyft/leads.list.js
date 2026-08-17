const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function leadsList({ businessId, args }) {
  const params = {};
  if (args.status) params.status = args.status;
  if (args.source) params.source = args.source;
  if (args.search) params.q = args.search;

  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/lead`,
    { params, headers: { 'x-gym-id': businessId } }
  );
  return data;
};
