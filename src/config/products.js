const PRODUCTS = {
  1: { id: 1, slug: 'zignalyft', displayName: 'ZignaLyft', header: 'x-gym-id' },
  2: { id: 2, slug: 'zignastay', displayName: 'ZignaStay', header: 'x-hotel-id' },
};

const HEADER_TO_PRODUCT = {};
Object.values(PRODUCTS).forEach((p) => {
  HEADER_TO_PRODUCT[p.header] = p;
});

module.exports = { PRODUCTS, HEADER_TO_PRODUCT };
