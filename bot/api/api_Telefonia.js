//API TELEFONÍAS
const axios = require("axios");

//API "VALIDAR OPERADOR"
// Función para esperar una cantidad de tiempo especificada
function retrasar(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function validarOp(tel, maxRetries = 3) {
  //URL API
  const apiUrl = `http://161.132.48.60:3500/valop?num=${tel}`;
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const responseApi = await axios.get(apiUrl);
      // Si la respuesta es exitosa, devolver los datos
      if (responseApi.status === 200) {
        return responseApi.data;
      }
    } catch (error) {
      attempts++;
      console.log("Error en la Api Validar Operador: " + error);
      // Reintenta solo si el estado es 500
      if (
        error.response &&
        error.response.status === 500 &&
        attempts < maxRetries
      ) {
        console.log(`Reintento ${attempts}: después de un error 500`);
        await retrasar(1000 * attempts); // Espera progresivamente más tiempo en cada reintento
      } else {
        // Si el error no es un 500 o ya se alcanzó el máximo de reintentos, lanza el error
        throw error;
      }
    }
  }

  // Si se agotan los intentos y siempre recibe 500, lanzar un nuevo error
  throw new Error(
    "Error en la API Validar Operador después de varios intentos"
  );
}

//API BITEL
async function apiBitel(tel) {
  //URL API
  const apiUrl = `http://161.132.48.228:8040/bitlive?num=${tel}`;

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
  const apiUrl = `http://161.132.48.228:2000/dni?dni=${dni}`;

  try {
    const responseApi = await axios.get(apiUrl);
    const data = responseApi.data;
    return data;
  } catch (error) {
    console.log("Error en la Api Movistar x DNI: " + error);
    throw error;
  }
}

//API ENTEL
async function apiEntel(tel) {
  //URL API
  const apiUrl = `http://161.132.48.60:5000/api/cel?num=${tel}`;

  try {
    const responseApi = await axios.get(apiUrl);
    const data = responseApi.data;
    return data;
  } catch (error) {
    console.log("Error en la Api Movistar x DNI: " + error);
    throw error;
  }
}

async function claroDni(dni) {
  const apiUrl = `http://161.132.48.228:1000/claro?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log(error);
  }
}

module.exports = { validarOp, apiBitel, apiMovDni, apiEntel, claroDni };
