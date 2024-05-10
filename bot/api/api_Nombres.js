const axios = require("axios");

// Función para simular una espera/demora
function retrasar(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function apiName_1(nombre, apPaterno = " ", apMaterno = " ") {
  // Convertir a mayúsculas
  nombre = nombre.toUpperCase();
  apPaterno = apPaterno.toUpperCase();
  apMaterno = apMaterno.toUpperCase();

  const url = `https://dashboard.knowlers.xyz/apires?tipo=personasxnombres&token=b305f85e20f73e1e27c6631065e69e93c9b5d0d8`;
  const api_url = `${url}&nombres=${nombre}&appMaterno=${apMaterno}&appPaterno=${apPaterno}`;
  let data;

  try {
    await retrasar(3000);

    let solicitude = await axios.get(api_url);
    data = solicitude.data;

    if (data.status === "await") {
      await retrasar(3000);
      solicitude = await axios.get(api_url);
      data = solicitude.data;

    }

    return data;
  } catch (error) {
    console.log("Error en la API PRESTADA NOMBRES: ", error);
    throw error;
  }
}

async function apiName_2(nombre, apPaterno = " ", apMaterno = " ", edadMin = "", edadMax = "") {
  // Convertir a mayúsculas
  nombre = nombre.toUpperCase();
  apPaterno = apPaterno.toUpperCase();
  apMaterno = apMaterno.toUpperCase();

  const url = `https://dashboard.knowlers.xyz/apires?tipo=reniecxnombresonline&token=e5b466caed670f122086d9f3be08e4424189a687`;
  const api_url = `${url}&nombre=${nombre}&apPaterno=${apPaterno}&apMaterno=${apMaterno}&edadMin=${edadMin}&edadMax=${edadMax}`;
  // console.log(api_url);
  let data;

  try {
    await retrasar(3000);

    let solicitude = await axios.get(api_url);
    data = solicitude.data;

    if (data.status === "await") {
      await retrasar(3000);
      solicitude = await axios.get(api_url);
      data = solicitude.data;

    }

    return data;
  } catch (error) {
    console.log("Error en la API PRESTADA NOMBRES: ", error);
    throw error;
  }
}

module.exports = { apiName_1, apiName_2};
