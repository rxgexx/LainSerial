const axios = require("axios");
const { titularMov } = require("./api_Telefonia");

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
  const apiUrl = `https://api.ddosis.fun/placav2?token=fbXY00AC9JLJtVlwBfxA563kPK0&placa=${placa}`;
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
  const apiUrl = `https://api.ddosis.fun/minedu?token=fbXY00AC9JLJtVlwBfxA563kPK0&dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR API NOTAS");
  }
}

async function api_trabajos(dni) {
  const apiUrl = `http://161.132.48.228:2450/consultar/dni?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR EN LA API INFOBURO");
  }
}

async function api_tive(placa) {
  const apiUrl = `http://161.132.49.101:7209/api/tive?placa=${placa}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR EN LA API INFOBURO");
  }
}

async function bienes(dni) {
  const apiUrl = `http://161.132.49.101:7209/api/bienesPDf?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR EN LA API INFOBURO");
  }
}

async function sbs_img(dni) {
  const apiUrl = `http://194.26.100.31:3122/sbs?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR EN LA API INFOBURO");
  }
}

async function api_insVehiculo(placa) {
  const apiUrl = `http://161.132.49.101:7209/api/plab?placa=${placa}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR EN LA API INFOBURO");
  }
}

async function migraciones(dni) {
  const apiUrl = `https://api.ddosis.fun/migraciones?token=fbXY00AC9JLJtVlwBfxA563kPK0&dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR EN LA API INFOBURO");
  }
}

module.exports = {
  apiPlaca,
  apiPlaca_2,
  apiMPFN,
  apiNotas,
  api_trabajos,
  api_tive,
  api_insVehiculo,
  bienes,
  sbs_img,
  migraciones,
};