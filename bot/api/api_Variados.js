const axios = require("axios");

async function apiPlaca(placa) {
  const apiUrl = `https://pla-img.onrender.com/api/imgsun?pla=${placa}`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Error en la api de placas: " + error);
  }
}

module.exports = { apiPlaca };
