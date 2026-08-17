const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function equipmentMaintenance({ businessId, args }) {
  const params = {};
  if (args.equipment_id) params.equipment_id = args.equipment_id;
  if (args.status) params.status = args.status;

  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/equipment/maintenance`,
    { params, headers: { 'x-gym-id': businessId } }
  );
  return data;
};
