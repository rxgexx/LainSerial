const axios = require("axios");

const url_vps = "http://161.132.55.207"


async function apiHogar(dni) {
  const apiUrl = `http://161.132.49.101:3535/hogar?dni=${dni}`;

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
  const apiUrl = `${url_vps}:2010/dni_electronico?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Error en la API HOGAR: ", error);
  }
}

async function seekerApi(dni) {
  const apiUrl = `http://161.132.38.231:3000/datos-por-documento?documento=${dni}&auth=che:sebas6969`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Error en la API SEEKER: ", error);
  }
}

async function seekerApi_pdf(dni) {
  const apiUrl = `${url_vps}:2210/seeker?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Error en la API SEEKER-PDF: ", error);
  }
}

async function seekerdni(dni) {
  // const apiUrl = `http://88.198.13.73:7845/api/seeker_original/dni/${dni}`;
  const apiUrl = `${url_vps}:3000/api/seeker_dni?dni=${dni}`;


  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Error en la API SEEKER: ", error);
  }
}

async function seekerpdf(dni) {
  const apiUrl = `${url_vps}:8511/seeker?dni=${dni}`;
  // const apiUrl = `http://88.198.13.73:7845/api/seeker_original/dni/${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Error en la API SEEKER PDF: ", error);
  }
}

async function infoburo(dni) {
  const apiUrl = `http://161.132.48.94:5000/api/infoburo/dni/${dni}`;
  // const apiUrl = `http://88.198.13.73:7845/api/seeker_original/dni/${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Error en la API SEEKER PDF: ", error);
  }
}


module.exports = {
  seekerpdf,
  apiHogar,
  apiname_2,
  dniElectronico,
  seekerApi,
  seekerApi_pdf,
  seekerdni,
  infoburo
};
