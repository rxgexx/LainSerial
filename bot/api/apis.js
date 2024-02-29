//SE IMPORTA AXIOS
const axios = require("axios");

//SE REQUIERE dotenv
require("dotenv").config({ path: "../../env/.env" });
const token_api = process.env.TOKEN_API;

//LINK API
const link_api = `https://api.ddosis.fun`;

//API RENIEC
async function getReniec(dni) {
  //END - PONT ACTA - API
  const API_ENDPOINT = `${link_api}/reniec`;
  const apiUrl = `${API_ENDPOINT}?token=${token_api}&dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    if (response.status !== 200) {
      throw new Error(`Error al obtener los datos reniec: ${response.status}`);
    }
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error al obtener los datos reniec desde la API");
    throw error;
  }
}

//API NOMBRES

async function getNombres(
  prinombre,
  apPaterno = " ",
  apMaterno = " ",
  minAge = " ",
  maxAge = " ",
  depa = " "
) {
  {
    let apiUrl = `http://161.132.41.107:3000/nombres?nombre=${prinombre}`;

    if (apPaterno !== "Ninguno") {
      apiUrl += `&apellidoPa=${apPaterno}`;
    }

    if (apMaterno !== "Ninguno") {
      apiUrl += `&apellidoMa=${apMaterno}`;
    }

    if (minAge !== "Ninguno") {
      apiUrl += `&minEdad=${minAge}`;
    }
    if (maxAge !== "Ninguno") {
      apiUrl += `&maxEdad=${maxAge}`;
    }

    if (depa !== "Ninguno") {
      apiUrl += `&depa=${depa}`;
    }

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

//API ACTA NACIMIENTO
async function getActaNacimiento(dni) {
  //END - PONT ACTA - API
  const API_ENDPOINT = `${link_api}/actanac`;
  const apiUrl = `${API_ENDPOINT}?token=${token_api}&dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    if (response.status !== 200) {
      throw new Error(
        `Error al obtener el acta de nacimiento: ${response.status}`
      );
    }
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error al obtener el acta de nacimiento desde la API");
    throw error;
  }
}

//API ACTA DEFUNCIÓN
async function getActaDefuncion(dni) {
  //END - PONT ACTA - API
  const API_ENDPOINT = `${link_api}/actadef`;
  const apiUrl = `${API_ENDPOINT}?token=${token_api}&dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    if (response.status !== 200) {
      throw new Error(
        `Error al obtener el acta de nacimiento: ${response.status}`
      );
    }
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error al obtener el acta de defunción desde la API");
    throw error;
  }
}

//API DNI VIRTUAL
async function getDNIVirtual(dni) {
  //END - POINT DNIVirtual - API
  const apiUrl = `http://161.132.41.107:4000/procesar_dni?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    if (response.status !== 200) {
      throw new Error(`Error al obtener el DNI Virtual: ${response.status}`);
    }
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error al obtener el DNI Virtual desde la API", error);
    throw error;
  }
}

//C4's
const fichaEndPoint = "http://161.132.41.107:4045";

//C4 azul
async function fichaAzul(dni) {
  //END - POINT FICHA AZUL - API
  const extencionFicha = "consulta/fichaAzul";
  const apiUrl = `${fichaEndPoint}/${extencionFicha}?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    if (response.status !== 200) {
      throw new Error(`Error al obtener la ficha azul: ${response.status}`);
    }
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error al obtener la ficha azul desde la API");
    throw error;
  }
}

async function fichaInscripcion(dni) {
  //END - POINT FICHA AZUL - API
  const extencionFicha = "consulta/fichaInscripcion";
  const apiUrl = `${fichaEndPoint}/${extencionFicha}?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    if (response.status !== 200) {
      throw new Error(`Error al obtener la ficha azul: ${response.status}`);
    }
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error al obtener la ficha azul desde la API");
    throw error;
  }
}

async function fichaAntPol(dni) {
  //END - POINT FICHA AZUL - API
  const extencionFicha = "consulta/certiPolicial";
  const apiUrl = `${fichaEndPoint}/${extencionFicha}?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    if (response.status !== 200) {
      throw new Error(`Error al obtener la ficha azul: ${response.status}`);
    }
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error al obtener la ficha azul desde la API");
    throw error;
  }
}

async function fichaAntJud(dni) {
  //END - POINT FICHA AZUL - API
  const extencionFicha = "consulta/antCertiJudiPenales";
  const apiUrl = `${fichaEndPoint}/${extencionFicha}?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    if (response.status !== 200) {
      throw new Error(`Error al obtener la ficha azul: ${response.status}`);
    }
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error al obtener la ficha azul desde la API");
    throw error;
  }
}

async function fichaAntPen(dni) {
  //END - POINT FICHA AZUL - API
  const extencionFicha = "consulta/antJudiciales";
  const apiUrl = `${fichaEndPoint}/${extencionFicha}?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    if (response.status !== 200) {
      throw new Error(`Error al obtener la ficha azul: ${response.status}`);
    }
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error al obtener la ficha azul desde la API");
    throw error;
  }
}

//API CEL
const apiTelEndPoint = "http://161.132.41.107:10";

async function getApiTel(tel) {
  //END - POINT TITULAR DE CELULAR - API
  const extencionApi = "consultar";
  const apiUrl = `${apiTelEndPoint}/${extencionApi}?tel=${tel}`;

  try {
    const response = await axios.get(apiUrl);
    if (response.status !== 200) {
      throw new Error(
        `Error al obtener la respuesta de la API-TEL: ${response.status}`
      );
    }
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error al obtener la respuesta desde la API-TEL", error);
    throw error;
  }
}

//API AUTO
async function titularPlaca(placa) {
  //END - PONTS TITULAR PLACAS
  const apiUrl_1 = `https://pla-img.onrender.com/api/imgsun?pla=${placa}`; //<-- API IMAGEN
  const apiUrl_2 = `http://161.132.41.107:7130/api/${placa}`;

  try {
    const response_1 = await axios.get(apiUrl_1);
    const response_2 = await axios.get(apiUrl_2);

    if (response_1.status !== 200) {
      throw new Error(
        `Error al obtener la información de la api_1: ${response_1.status}`
      );
    }

    if (response_2.status !== 200) {
      throw new Error(
        `Error al obtener la información de la api_2: ${response_2.status}`
      );
    }
    const data_1 = response_1.data;
    const data_2 = response_2.data;

    return {
      api1: data_1,
      api2: data_2,
    };
  } catch (error) {
    console.error(
      "Error al obtener la información desde alguna de las APIS de PLACAS"
    );
    throw error;
  }
}

//API CUIT ARGENTINO
async function argentinaData(cuit) {
  //END - PONIT CUIT - API
  const apiUrl = `https://prueba-argen.onrender.com/api/argen/cui?cui=${cuit}`;

  try {
    const response = await axios.get(apiUrl);
    if (response.status !== 200) {
      throw new Error(
        `Error al obtener la información del CUIT: ${response.status}`
      );
    }
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error al obtener la información del CUIT desde la API");
    throw error;
  }
}

module.exports = {
  getReniec,
  getNombres,
  getActaNacimiento,
  getActaDefuncion,
  getDNIVirtual,
  fichaAzul,
  fichaInscripcion,
  fichaAntPol,
  fichaAntJud,
  fichaAntPen,
  getApiTel,
  titularPlaca,
  argentinaData,
};
