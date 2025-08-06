const axios = require("axios");

async function mpfnDni(dni) {
  const apiUrl = `http://161.132.48.228:1001/mpfn?dni=${dni}`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR API MPFN x DNI: " + error);
  }
}

async function mpfnCaso(caso) {
  const apiUrl = `http://161.132.48.228:1001/mpfn/caso?caso=${caso}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR API MPFN x DNI: " + error);
  }
}

async function antPersona(dni) {
  const apiUrl = `http://161.132.68.46:8000/ant/persona?dni=${dni}`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR API MPFN x DNI: " + error);
  }
}

async function rqPla(placa) {
  const apiUrl = `http://161.132.68.46:8000/rq/vehi?placa=${placa}`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR API MPFN x DNI: " + error);
  }
}

async function rqPer(dni) {
  const apiUrl = `http://161.132.68.46:8000/rq/persona?dni=${dni}`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR API MPFN x DNI: " + error);
  }
}

async function fiscalia(dni) {
  const apiUrl = `https://api.sinflower.net.pe/api/fiscalia_original`;

  const data = {
    valor: dni,
    token: "822b6e74d591f9bb81a0663c057485e0",
    user: "sinflowxr",
  };

  try {
    const response = await axios.post(apiUrl, data);
    if (response.status !== 200) {
      throw new Error(`Error al obtener el fiscalia_pdf: ${response.status}`);
    }
    const data_res = response.data.data.datos_fis;

    return data_res;
  } catch (error) {
    console.error("Error al obtener el DNI Virtual desde la API", error);
    throw error;
  }
}

async function fiscalia_pdf(dni) {
  const apiUrl = `https://api.sinflower.net.pe/api/fiscalia_pdf`;

  const data = {
    valor: dni,
    token: "822b6e74d591f9bb81a0663c057485e0",
    user: "sinflowxr",
  };

  try {
    const response = await axios.post(apiUrl, data);
    if (response.status !== 200) {
      throw new Error(`Error al obtener el fiscalia_pdf: ${response.status}`);
    }
    const data_res = response.data.data.datos_fis;

    return data_res;
  } catch (error) {
    console.error("Error al obtener el DNI Virtual desde la API", error);
    throw error;
  }
}

async function denuncias(dni) {
  const apiUrl = `http://161.132.47.47:1535/api/denuncias_pdf/${dni}?auth=GQkp3m8EsGwz8stJGnldEgYap7gvJW5Hf1K2MtlDV9s`;

  try {
    const response = await axios.get(apiUrl);

    const data_res = response.data;

    return data_res;
  } catch (error) {
    console.error("Error al obtener el DNI Virtual desde la API", error);
    throw error;
  }
}

module.exports = {
  mpfnDni,
  mpfnCaso,
  antPersona,
  rqPla,
  rqPer,
  fiscalia,
  fiscalia_pdf,
  denuncias,
};
