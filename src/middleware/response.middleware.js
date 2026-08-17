module.exports = function responseMiddleware(req, res, next) {
  res.ok = ({ message, data, meta }) => {
    const payload = {
      request_id: req.request_id,
      status: true,
      message: message || 'Success',
    };
    if (data !== undefined) payload.data = data;
    if (meta !== undefined) payload.meta = meta;
    return res.status(200).json(payload);
  };

  res.created = ({ message, data }) => {
    const payload = {
      request_id: req.request_id,
      status: true,
      message: message || 'Created',
    };
    if (data !== undefined) payload.data = data;
    return res.status(201).json(payload);
  };

  res.badRequest = ({ message, code }) => {
    return res.status(code || 400).json({
      request_id: req.request_id,
      status: false,
      error: true,
      responseCode: code || 400,
      message: message || 'Bad request',
    });
  };

  res.unauthorized = ({ message }) => {
    return res.status(401).json({
      request_id: req.request_id,
      status: false,
      error: true,
      responseCode: 401,
      message: message || 'Not authenticated',
    });
  };

  res.forbidden = ({ message }) => {
    return res.status(403).json({
      request_id: req.request_id,
      status: false,
      error: true,
      responseCode: 403,
      message: message || 'Forbidden',
    });
  };

  res.notFound = ({ message }) => {
    return res.status(404).json({
      request_id: req.request_id,
      status: false,
      error: true,
      responseCode: 404,
      message: message || 'Not found',
    });
  };

  res.serverError = ({ message }) => {
    return res.status(500).json({
      request_id: req.request_id,
      status: false,
      error: true,
      responseCode: 500,
      message: message || 'An unexpected error occurred',
    });
  };

  next();
};
