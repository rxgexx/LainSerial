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
  const apiUrl = `http://161.132.48.228:3142/ant/persona?dni=${dni}`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR API MPFN x DNI: " + error);
  }
}

async function rqPla(placa) {
  const apiUrl = `http://161.132.48.228:3142/rq/vehi?placa=${placa}`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR API MPFN x DNI: " + error);
  }
}

async function rqPer(dni) {
  const apiUrl = `http://161.132.48.228:3142/rq/persona?dni=${dni}`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR API MPFN x DNI: " + error);
  }
}

async function fiscalia(dni) {
  const apiUrl = `http://161.132.56.149:9911/api/fiscalia/original?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR API MPFN x DNI: " + error);
  }
}

module.exports = { mpfnDni, mpfnCaso, antPersona, rqPla, rqPer, fiscalia };
