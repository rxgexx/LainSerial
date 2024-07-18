const axios = require("axios");

async function apiPlaca(placa) {
  const apiUrl = `https://placa-img7.onrender.com/api/imgsun?pla=${placa}`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Error en la api de placas: " + error);
  }
}

async function apiPlaca_2(placa) {
  const apiUrl = `https://api.ddosis.fun/placav2?token=gD75X1MxvcbuOxe11d6dJUiQlpv&placa=${placa}`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Error en la api de placas: " + error);
  }
}

async function apiMPFN(dni) {
  const apiUrl = `http://161.132.41.107:3000/mpfn?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR EN LA API MPFN: " + error);
  }
}

async function apiNotas(dni) {
  const apiUrl = `https://api.ddosis.fun/minedu?token=gD75X1MxvcbuOxe11d6dJUiQlpv&dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR API NOTAS");
  }
}

async function api_trabajos(dni) {
  const apiUrl = `http://161.132.38.231:2175/laboral?dni=${dni}&auth=clay:osiris`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR EN LA API INFOBURO");
  }
}

module.exports = { apiPlaca, apiPlaca_2, apiMPFN, apiNotas, api_trabajos };
