//API TELEFONÍAS
const axios = require("axios");

//API "VALIDAR OPERADOR"
// Función para esperar una cantidad de tiempo especificada
function retrasar(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// async function validarOp(tel, maxRetries = 3) {
//   //URL API
//   const apiUrl = `http://161.132.48.60:3500/valop?num=${tel}`;
//   let attempts = 0;

//   while (attempts < maxRetries) {
//     try {
//       const responseApi = await axios.get(apiUrl);
//       // Si la respuesta es exitosa, devolver los datos
//       if (responseApi.status === 200) {
//         return responseApi.data;
//       }
//     } catch (error) {
//       attempts++;
//       console.log("Error en la Api Validar Operador: " + error);
//       // Reintenta solo si el estado es 500
//       if (
//         error.response &&
//         error.response.status === 500 &&
//         attempts < maxRetries
//       ) {
//         console.log(`Reintento ${attempts}: después de un error 500`);
//         await retrasar(1000 * attempts); // Espera progresivamente más tiempo en cada reintento
//       } else {
//         // Si el error no es un 500 o ya se alcanzó el máximo de reintentos, lanza el error
//         throw error;
//       }
//     }
//   }

//   // Si se agotan los intentos y siempre recibe 500, lanzar un nuevo error
//   throw new Error(
//     "Error en la API Validar Operador después de varios intentos"
//   );
// }

async function validarOp(tel) {
  const url = `http://161.132.49.101:4301/api/valnum?num=${tel}`;
  const payload = {
    phone: tel,
  };

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error after logging it
  }
}

//API BITEL
async function apiBitel(tel) {
  // URL API
  const apiUrl = `http://161.132.49.101:1010/bitlive?num=${tel}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const responseApi = await axios.get(apiUrl);
      const data = responseApi.data;

      if (data && data.status) {
        return data; // Retorna los datos si la consulta fue exitosa
      } else {
        throw new Error("Respuesta inválida de la API Bitel");
      }
    } catch (error) {
      console.log(
        `Intento ${attempt} - Error en la Api Bitel: ${error.message}`
      );
      if (attempt === 2) {
        // Si falla el segundo intento, retorna el mensaje de error
        return {
          response: "Error en la consulta Bitel",
          status: false,
        };
      }
    }
  }
}

// async function apiBitel(tel) {
//   //URL API
//   const apiUrl = `http://161.132.49.101:1010/bitlive?num=${tel}`;

//   try {
//     const responseApi = await axios.get(apiUrl);
//     const data = responseApi.data;
//     return data;
//   } catch (error) {
//     console.log("Error en la Api Bitel: " + error);
//     throw error;
//   }
// }


//API MOVISTAR x DNI
async function apiMovDni(dni) {
  //URL API
  const apiUrl = `http://161.132.55.230:4010/dni/${dni}`;

  try {
    const responseApi = await axios.get(apiUrl);
    const data = responseApi.data;
    return data;
  } catch (error) {
    console.log("Error en la Api Movistar x DNI: " + error);
    throw error;
  }
}

//API MOVISTAR
async function titularMov(tel) {
  //END - POINT
  const apiUrl = `http://161.132.50.110:4981/movistarperu/numero?num=${tel}`;

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

//API ENTEL
async function apiEntel(tel) {
  //URL API
  const apiUrl = `http://161.132.48.228:7894/api/cel?num=${tel}`;

  try {
    const responseApi = await axios.get(apiUrl);
    const data = responseApi.data;
    return data;
  } catch (error) {
    console.log("Error en la Api Movistar x DNI: " + error);
    throw error;
  }
}

async function claroDni(dni) {
  const apiUrl = `http://161.132.50.110:1212/claro?dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function seekertel(tel) {
  const apiUrl = `http://161.132.56.103:3000/api/seeker_numero?num=${tel}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function osiptel(dni) {
  const apiUrl = `https://api.ddosis.fun/osiptel?token=fbXY00AC9JLJtVlwBfxA563kPK0&dni=${dni}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Error en la API SEEKER: ", error);
  }
}

async function davidapi_dni(dni) {
  const url = `http://161.132.48.228:3550/api/consulta_telefonia/dni/${dni}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error after logging it
  }
}

async function davidapi_tel(tel) {
  const url = `http://161.132.48.228:3550/api/consulta_telefonia/numero/${tel}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error after logging it
  }
}

module.exports = {
  validarOp,
  apiBitel,
  apiMovDni,
  titularMov,
  apiEntel,
  claroDni,
  seekertel,
  osiptel,
  davidapi_dni,
  davidapi_tel
};
