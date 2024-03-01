//API TELEFONÍAS
const axios = require("axios");

//API "VALIDAR OPERADOR"
async function validarOp(tel) {
  //URL API
  const apiUrl = `https://val-num.onrender.com/val?num=${tel}`;

  try {
    const responseApi = await axios.get(apiUrl);
    const data = responseApi.data;
    return data;
  } catch (error) {
    console.log("Error en la Api Validar Operador: " + error);
    throw error;
  }
}

module.exports = { validarOp };
