//API TELEFONÍAS
const axios = require("axios");

//API "VALIDAR OPERADOR"
async function validarOp(tel) {
  //URL API
  const apiUrl = `https://valid-op.onrender.com/val?num=${tel}`;

  try {
    const responseApi = await axios.get(apiUrl);
    const data = responseApi.data;
    return data;
  } catch (error) {
    console.log("Error en la Api Validar Operador: " + error);
    throw error;
  }
}

//API BITEL
async function apiBitel(tel) {
  //URL API
  const apiUrl = `https://bitel-respaldo1.onrender.com/bitresp?num=${tel}`;

  try {
    const responseApi = await axios.get(apiUrl);
    const data = responseApi.data;
    return data;
  } catch (error) {
    console.log("Error en la Api Bitel: " + error);
    throw error;
  }
}

//API MOVISTAR x DNI
async function apiMovDni(dni) {
  //URL API
  const apiUrl = `http://161.132.48.223:2000/movistar/dni?dni=${dni}`;

  try {
    const responseApi = await axios.get(apiUrl);
    const data = responseApi.data;
    return data;
  } catch (error) {
    console.log("Error en la Api Movistar x DNI: " + error);
    throw error;
  }
}

module.exports = { validarOp, apiBitel, apiMovDni };
