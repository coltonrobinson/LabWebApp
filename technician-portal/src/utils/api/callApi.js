import axios from 'axios';
import ip from '../ip/ip';

async function callApi(endPoint, parameters) {
  const url = `http://${ip}:8000/api/${endPoint}/`;

  try {
    const response = await axios.get(url, { params: parameters });
    return response.data;
  } catch (error) {
    return error;
  }
}

export default callApi;