//SE IMPORTA AXIOS
const axios = require("axios");

//SE REQUIERE dotenv
require("dotenv").config({ path: "../../env/.env" });
const token_api = process.env.TOKEN_API;

//LINK API
const link_api = `https://api.ddosis.fun`;

function retrasar(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

//API RENIEC
async function getReniec(dni) {
  //  const apiUrl = `http://161.132.48.228:8811/reniec?dni=${dni}`;
  const apiUrl = `https://api.sinflower.net.pe/api/reniec`;

  const payload = {
    valor: dni,
    user: "sinflowxr",
    token: "822b6e74d591f9bb81a0663c057485e0",
  };

  try {
    const response = await axios.post(apiUrl, payload);
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error al obtener los datos de RENIEC desde la API:", error);
    throw error;
  }
}

//API NOMBRES

async function getNombres(prinombre, apPaterno = " ", apMaterno = " ") {
  const apiUrl = `https://api.sinflower.net.pe/api/nombres`;

  const payload = {
    nombres: prinombre,
    apePaterno: apPaterno,
    apeMaterno: apMaterno,
    edadMin: 0,
    edadMax: 0,
    token: "822b6e74d591f9bb81a0663c057485e0",
    user: "sinflowxr",
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.log("Error en la API de nombres:", error.message);
    throw error;
  }
}

//API ACTA NACIMIENTO
//API ACTA NACIMIENTO
async function getActaNacimiento(dni) {
  //END - PONT ACTA - API
  const apiUrl = `http://161.132.55.224:7831/api/acta/nacimiento/${dni}`;

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

//API ACTA NACIMIENTO
async function getActaMatrimonio(dni) {
  //END - PONT ACTA - API
  const apiUrl = `http://161.132.55.224:7831/api/acta/matrimonio/${dni}`;

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
  const apiUrl = `http://161.132.55.224:7831/api/acta/defuncion/${dni}`;

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
  const apiUrl = `https://api.sinflower.net.pe/api/dni_virtual`;

  const data = {
    valor: dni,
    token: "822b6e74d591f9bb81a0663c057485e0",
    user: "sinflowxr",
  };

  try {
    const response = await axios.post(apiUrl, data);
    if (response.status !== 200) {
      throw new Error(`Error al obtener el DNI Virtual: ${response.status}`);
    }
    const data_res = response.data.data.data_dnivirtual;
    console.log(data_res);

    return data_res;
  } catch (error) {
    console.error("Error al obtener el DNI Virtual desde la API", error);
    throw error;
  }
}

//C4's
const fichaEndPoint = "http://161.132.48.228:4045";

//C4 azul
async function fichaAzul(dni) {
  const apiUrl = `https://api.sinflower.net.pe/api/c4azul`;

  try {
    const payload = {
      valor: dni,
      user: "sinflowxr",
      token: "822b6e74d591f9bb81a0663c057485e0",
    };

    const response = await axios.post(apiUrl, payload);

    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error al obtener la ficha azul desde la API");
    throw error;
  }
}

async function fichaInscripcion(dni) {
  try {
    const url = "https://api.sinflower.net.pe/api/ficha-inscripcion";
    const data_api = {
      valor: dni,
      token: "822b6e74d591f9bb81a0663c057485e0",
      user: "sinflowxr",
    };

    const response = await axios.post(url, data_api);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("🚀 ~ get_fichains ~ error:", error);
  }
}

async function fichaAntPol(dni) {
  try {
    const url = "https://api.sinflower.net.pe/api/ficha-antpol";
    const data_api = {
      valor: dni,
      token: "822b6e74d591f9bb81a0663c057485e0",
      user: "sinflowxr",
    };

    const response = await axios.post(url, data_api);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("🚀 ~ api_antpol ~ error:", error);
  }
}

async function fichaAntPen(dni) {
  try {
    const url = "https://api.sinflower.net.pe/api/ficha-antpen";
    const data_api = {
      valor: dni,
      token: "822b6e74d591f9bb81a0663c057485e0",
      user: "sinflowxr",
    };

    const response = await axios.post(url, data_api);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("🚀 ~ api_antpen ~ error:", error);
  }
}

async function fichaAntJud(dni) {
  try {
    const url = "https://api.sinflower.net.pe/api/ficha-antjud";
    const data_api = {
      valor: dni,
      token: "822b6e74d591f9bb81a0663c057485e0",
      user: "sinflowxr",
    };

    const response = await axios.post(url, data_api);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("🚀 ~ api_antjud ~ error:", error);
  }
}
//API CEL
const apiTelEndPoint = "http://161.132.48.228:10";

async function getApiTel(tel) {
  //END - POINT TITULAR DE CELULAR - API
  const extencionApi = "consultar";
  A;
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

//API VALIDACIÓN
async function apiValidar(tel) {
  //END - POINT
  const apiUrl = `https://val-apinum.onrender.com/val?num=${tel}`;

  try {
    const responseApi = await axios.get(apiUrl);

    if (responseApi.status !== 200) {
      throw new Error(
        `Error al obtener la información de la api VALIDACION NUMERO: ${responseApi.status}`
      );
    }

    const data = responseApi.data;
    return data;
  } catch (error) {
    console.log(`Error en la api Validacion Numero: ` + error);
  }
}

//API BITEL
async function titularBitel(tel) {
  //END - POINT
  const apiUrl = `https://bit2-dat.onrender.com/bit?num=${tel}`;

  try {
    const responseBitel = await axios.get(apiUrl);

    if (responseBitel.status !== 200) {
      throw new Error(
        `Error al obtener la información de la api BITEL: ${responseBitel.status}`
      );
    }

    const data = responseBitel.data;
    return data;
  } catch (error) {
    console.log("Error en la api Bitel: ", error);
  }
}

//API CLARO
async function titularClaro(tel) {
  //END - PINT
  const apiUrl = `https://api.sinflower.net.pe/api/claro_num`;

  const payload = {
    valor: tel,
    user: "sinflowxr",
    token: "822b6e74d591f9bb81a0663c057485e0",
  };

  try {
    const responseClaro = await axios.post(apiUrl, payload);

    const data = responseClaro.data;
    return data;
  } catch (error) {
    console.log("Error en la api Claro: ", error);
  }
}

//API MOVISTAR
async function titularMov(tel) {
  //END - POINT
  const apiUrl = `http://161.132.56.82:4010/numero/${tel}`;

  try {
    const responseMovistar = await axios.get(apiUrl);

    if (responseMovistar.status !== 200) {
      throw new Error(
        "Error al obtener la información de la api MOVISTAR: ",
        responseMovistar.status
      );
    }

    const data = responseMovistar.data;
    return data;
  } catch (error) {
    console.log("Error en la api Movistar: ", error);
  }
}

//API MOVISTAR x DNI
async function numerosMov(dni) {
  //END - POINT
  const apiUrl = `https://movistar-6j4y.onrender.com/movistar/dni?dni=${dni}`;

  const responseMovistar = await axios.get(apiUrl);

  try {
    if (responseMovistar.status !== 200) {
      throw new Error(
        "Error al obtener la información de la api MOVISTAR x DNI: ",
        responseMovistar.status
      );
    }

    const data = responseMovistar.data;
    return data;
  } catch (error) {
    console.log("Error en la api Movistar x DNI: ", error);
  }
}

//API CELULAR BÁSICO
async function titularBasic(tel) {
  const apiUrl = `http://161.132.48.228:4411/numero/${tel}`;
  const headers = {
    Authorization:
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InQ0NTUifQ.FD_By1cV_G0t2gUvu_vsj6AvXrClXCBtPX5w82QuxhY",
  };

  const responseTitular = await axios.get(apiUrl);

  try {
    if (responseTitular.status !== 200) {
      throw new Error(
        "Error al obtener la información de la api TITULAR BASICO: ",
        responseTitular.status
      );
    }

    const data = responseTitular.data;
    return data;
  } catch (error) {
    console.log("Error en la api TITULAR BASICO: ", error);
  }
}

//API CELULAR BÁSICO
async function datosNum(dni) {
  const apiUrl = `http://161.132.48.228:4411/dni/${dni}`;
  const headers = {
    Authorization:
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InQ0NTUifQ.FD_By1cV_G0t2gUvu_vsj6AvXrClXCBtPX5w82QuxhY",
  };

  const responseTitular = await axios.get(apiUrl);

  try {
    if (responseTitular.status !== 200) {
      throw new Error(
        "Error al obtener la información de la api TITULAR BASICO: ",
        responseTitular.status
      );
    }

    const data = responseTitular.data;
    return data;
  } catch (error) {
    console.log("Error en la api TITULAR BASICO: ", error);
  }
}

//API AUTO
async function titularPlaca(placa) {
  //END - PONTS TITULAR PLACAS
  const apiUrl_1 = `https://pla-img.onrender.com/api/imgsun?pla=${placa}`; //<-- API IMAGEN
  const apiUrl_2 = `http://161.132.48.228:7130/api/${placa}`;

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

//ÁRBOL GENEALÓGICO
async function arbolGen(dni) {
  //END - POINT
  const apiUrl = `https://apiarbol6.pythonanywhere.com/docragex/${dni}`;

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
    console.error("Error al obtener la información desde la API ARBOL");
    throw error;
  }
}

//ÁRBOL GENEALÓGICO 2
async function arbolGen2(dni) {
  try {
    const url = "https://api.sinflower.net.pe/api/arbol_genealogico";
    const data_api = {
      valor: dni,
      token: "822b6e74d591f9bb81a0663c057485e0",
      user: "sinflowxr",
    };

    const response = await axios.post(url, data_api);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("🚀 ~ api_licencia ~ error:", error);
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

async function c4blanco(dni) {
  try {
    const url = "https://api.sinflower.net.pe/api/c4blanco";
    const data_api = {
      valor: dni,
      token: "822b6e74d591f9bb81a0663c057485e0",
      user: "sinflowxr",
    };

    const response = await axios.post(url, data_api);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("🚀 ~ c4_blanco ~ error:", error);
  }
}

module.exports = {
  getReniec,
  getNombres,
  getActaNacimiento,
  getActaMatrimonio,
  getActaDefuncion,
  getDNIVirtual,
  fichaAzul,
  fichaInscripcion,
  fichaAntPol,
  fichaAntJud,
  fichaAntPen,
  getApiTel,
  apiValidar,
  titularBitel,
  titularClaro,
  titularMov,
  numerosMov,
  titularBasic,
  titularPlaca,
  arbolGen,
  arbolGen2,
  argentinaData,
  datosNum,
  c4blanco,
};
