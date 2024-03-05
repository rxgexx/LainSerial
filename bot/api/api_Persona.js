const axios = require("axios");

async function apiHogar(dni) {
  const apiUrl = `http://161.132.39.19:5050/apiv1/hogar/${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Error en la API HOGAR: ", error);
  }
}

module.exports = {apiHogar};
