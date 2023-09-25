const ip = process.env.REACT_APP_STATUS === 'production'
? process.env.REACT_APP_PROD_IP
: process.env.REACT_APP_DEV_IP;

export default ip;