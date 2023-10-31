const jwt = require("jsonwebtoken");

const generateToken = (payload, secretKey, expiresIn = "1d") => {
  return jwt.sign(payload, secretKey, {
    expiresIn,
  });
};

const generateTokens = (payload, secretKey, expiresIn = "1d") => {
  const accessToken = generateToken(payload, secretKey, expiresIn);
  const refreshToken = generateToken(payload, secretKey, "7d");
  return { accessToken, refreshToken };
};

const decode = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.log('JWT decode error ', error);
  }
}

const verify = (token, secretKey) => {
  return jwt.verify(token, secretKey);
}


module.exports = {
  generateToken,
  generateTokens,
  decode,
  verify
};
