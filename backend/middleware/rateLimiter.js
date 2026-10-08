const rateLimitStore = {};

export const rateLimiter = (limit = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    // Basic IP rate limiting
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!rateLimitStore[ip]) {
      rateLimitStore[ip] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    const record = rateLimitStore[ip];

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    record.count++;

    if (record.count > limit) {
      return res.status(429).json({
        error: 'Too many requests from this IP. Please try again later.'
      });
    }

    next();
  };
};

export default rateLimiter;
