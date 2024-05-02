const axios = require("axios");

async function apiHogar(dni) {
  const apiUrl = `https://app-hogar-api4.onrender.com/hogar?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Error en la API HOGAR: ", error);
  }
}

async function apiname_2(prinombre, apPaterno = " ", apMaterno = " ") {
  {
    let apiUrl = `https://servicioapis.zyra-dark.online/nm.php?apeP=${apPaterno}&apeM=${apMaterno}&nom=${prinombre}`;

    return axios
      .get(apiUrl)
      .then((response) => {
        const data = response.data;
        return data;
      })
      .catch((error) => {
        console.log("Error en la api de nombres: ", error);
        throw error;
      });
  }
}
async function dniElectronico(dni) {
  const apiUrl = `http://161.132.48.228:2010/consulta?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Error en la API HOGAR: ", error);
  }
}
module.exports = { apiHogar, apiname_2, dniElectronico };
