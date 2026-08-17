const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function retentionAnalytics({ businessId, args }) {
  const params = {};
  if (args.from) params.from = args.from;
  if (args.to) params.to = args.to;
  if (args.range) params.range = args.range;

  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/retention/analytics`,
    { params, headers: { 'x-gym-id': businessId } }
  );
  return data;
};
