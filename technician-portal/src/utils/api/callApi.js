import ip from "../ip/ip";

async function callApi(endPoint, parameters) {
    const url = `http://${ip}:8000/api/${endPoint}/`;
    const params = new URLSearchParams();
    for (const parameter in parameters) {
      params.append(parameter, parameters[parameter])
    }
  
    return fetch(`${url}?${params.toString()}`)
      .then(response => response.json())
      .then(response => {
        return response;
      })
      .catch(error => {
        return error;
      });
  }

  export default callApi;