const axios = require("axios");

async function mpfnDni(dni) {
  const apiUrl = `http://161.132.48.228:7040/mpfn?dni=${dni}`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR API MPFN x DNI: " + error);
  }
}

async function mpfnCaso(caso) {
  const apiUrl = `http://161.132.48.228:1005/mpfn/caso?caso=${caso}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR API MPFN x DNI: " + error);
  }
}

module.exports = { mpfnDni, mpfnCaso };
