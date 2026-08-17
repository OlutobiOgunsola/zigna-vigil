const { ForbiddenError } = require('../errors');
const { BUSINESS_ENTITY_ERROR_MESSAGES } = require('../lib/literature/errors.literature');
const { HEADER_TO_PRODUCT } = require('../config/products');

const HEADER_TO_BUSINESS_TYPE = {
  'x-gym-id': 'gym',
  'x-hotel-id': 'hotel',
};

module.exports = async function businessEntityMiddleware(req, res, next) {
  try {
    const gymId = req.headers['x-gym-id'];
    const hotelId = req.headers['x-hotel-id'];

    if (!gymId && !hotelId) {
      throw new ForbiddenError(BUSINESS_ENTITY_ERROR_MESSAGES.NO_CONTEXT);
    }

    let product;
    let header;
    if (gymId) {
      header = 'x-gym-id';
      product = HEADER_TO_PRODUCT[header];
      req.activeBusinessId = gymId;
    } else {
      header = 'x-hotel-id';
      product = HEADER_TO_PRODUCT[header];
      req.activeBusinessId = hotelId;
    }

    req.productId = product.id;
    req.productSlug = product.slug;
    req.activeBusinessType = HEADER_TO_BUSINESS_TYPE[header];

    // TODO: When product APIs are available, validate membership here:
    // 1. Call product API to verify user has an active membership for this entity
    // 2. Set req.activeRole from the membership response
    req.activeRole = req.isSuperAdmin ? 'super_admin' : 'user';

    next();
  } catch (error) {
    next(error);
  }
};
