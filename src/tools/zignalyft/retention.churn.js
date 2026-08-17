const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function retentionChurn({ businessId, args }) {
  const params = {};
  if (args.churn_reason) params.churn_reason = args.churn_reason;
  if (args.from) params.from = args.from;
  if (args.to) params.to = args.to;

  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/retention/churn`,
    { params, headers: { 'x-gym-id': businessId } }
  );
  return data;
};
