const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function instructorsAssigned({ businessId, args }) {
  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/instructor/${args.instructorId}/assigned-members`,
    { headers: { 'x-gym-id': businessId } }
  );
  return data;
};
