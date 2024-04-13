const axios = require("axios");

async function apiHogar(dni) {
  const apiUrl = `https://app-hogar-api2.onrender.com/hogar?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Error en la API HOGAR: ", error);
  }
}

module.exports = {apiHogar};
