const { compare, hash } = require('bcrypt');
const sha256 = require('js-sha256');

const hashAndValidatePassword = async (password, saltRounds) => {
  return hash(password, saltRounds);
};

const verify = async (password, hashPassword) => {
  if (!hashPassword) {
    return false;
  }
  return compare(password, hashPassword);
};

const hashPassword = async (password, hashString, preHashSalt = 'hash-password') => {
  return sha256.hmac.create(preHashSalt).update(`${hashString}${preHashSalt}${password}`).hex();
};

module.exports = {
  hashAndValidatePassword,
  verify,
  hashPassword,
};
