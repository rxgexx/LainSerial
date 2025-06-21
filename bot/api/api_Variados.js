const axios = require("axios");
const url_vps = "http://161.132.56.176";

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
  const apiUrl = `http://161.132.48.228:7833/api/atu_backoffice/placa/${placa}`;
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
  const apiUrl = `https://api.sinflower.net.pe/api/minedu`;

  try {
    const response = await axios.post(apiUrl, {
      valor: dni,
      token: "822b6e74d591f9bb81a0663c057485e0",
      user: "sinflowxr",
    });
    const data = response.data;
    return data;
  } catch (error) {
    console.log("ERROR API NOTAS");
  }
}

async function api_trabajos(dni) {
  const apiUrl = `https://api.sinflower.net.pe/api/seeker_dni`;

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
    console.log("Error en la API SEEKER: ", error);
  }
}

async function api_tive(placa) {
  const apiUrl = `http://161.132.49.101:7209/api/tive2?placa=${placa}`;

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
  const apiUrl = `https://24b9-62-197-145-21.ngrok-free.app/captura?documento=${dni}`;

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

async function boletaInformativa(placa) {
  const apiUrl = `http://161.132.48.228:2215/placa?placa=${placa}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;

    return data;
  } catch (error) {
    console.log("ERROR EN LA API PLACA");
  }
}

async function migracionesPdf(dni) {
  const apiUrl = `http://161.132.48.228:2117/migraciones/pdf?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;

    return data;
  } catch (error) {
    console.log("ERROR EN LA API PLACA");
  }
}

async function arbolVisual(dni) {
  const apiUrl = `http://161.132.50.110:42991/captura/${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;

    return data;
  } catch (error) {
    console.log("ERROR EN LA API PLACA");
  }
}

async function detalleLicencia(dni) {
  const apiUrl = `http://161.132.50.110:49012/api/record?dni=${dni}`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;

    return data;
  } catch (error) {
    console.log("ERROR EN LA API PLACA");
  }
}

async function reviTec(pla) {
  const apiUrl = `http://161.132.50.110:49012/api/citv?placa=${pla}`;

  try {
    let response = await axios.get(apiUrl);
    let data = response.data;

    if (data.msg === "El código de chaptcha ingresado no es correcto.") {
      response = await axios.get(apiUrl); // Hacer un solo reintento
      data = response.data;
    }

    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function infRUC(ruc) {
  const apiUrl = `http://161.132.50.110:3584/api/sunat?ruc=${ruc}`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;

    return data;
  } catch (error) {
    console.log("ERROR EN LA API PLACA");
  }
}

async function satApi(pla) {
  const apiUrl = `http://161.132.50.110:49012/api/sat?placa=${pla}`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;

    return data;
  } catch (error) {
    console.log("ERROR EN LA API PLACA");
  }
}

async function brevete_pdf(dni) {
  const apiUrl = `https://api.sinflower.net.pe/api/brevete_pdf`;

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
    console.log("ERROR EN LA API PLACA");
  }
}

async function soat_pdf(placa) {
  const apiUrl = `https://api.sinflower.net.pe/api/soat-pdf`;
  try {
    const response = await axios.post(apiUrl, {
      valor: placa,
      token: "822b6e74d591f9bb81a0663c057485e0",
      user: "sinflowxr",
    });
    const data = response.data;

    return data;
  } catch (error) {
    console.log("ERROR EN LA API PLACA");
  }
}

async function yape_fake(titular, numero, precio, destino) {
  const apiUrl = `https://api.sinflower.net.pe/api/yape-fake`;

  const payload = {
    precio: precio,
    titular: titular,
    numero: numero,
    destino: destino,
    token: "822b6e74d591f9bb81a0663c057485e0",
    user: "sinflowxr",
  };

  try {
    const response = await axios.post(apiUrl, payload);
    const data = response.data;
    return data;
  } catch (error) {
    console.error(
      "❌ Error al consultar API:",
      error.response?.data || error.message
    );

    // Mostrar detalles del request para depuración
    if (error.response) {
    }

    return null;
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
  boletaInformativa,
  migracionesPdf,
  arbolVisual,
  detalleLicencia,
  reviTec,
  infRUC,
  satApi,
  brevete_pdf,
  soat_pdf,
  yape_fake,
};
