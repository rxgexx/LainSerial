const axios = require("axios");

async function apiPlaca(placa) {
  const apiUrl = `https://placa-img2.onrender.com/api/imgsun?pla=${placa}`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Error en la api de placas: " + error);
  }
}

async function apiMPFN(dni){
  const apiUrl = `http://161.132.41.107:3000/mpfn?dni=${dni}`

  try {
    const response = await axios.get(apiUrl)
    const data = response.data
    return data
  } catch (error) {
    console.log("ERROR EN LA API MPFN: " + error);
  }
}

async function apiNotas(dni){
  const apiUrl = `https://api.ddosis.fun/minedu?token=NjWzldwgBYlbShDPwIEGkZZkvfn&dni=${dni}`

  try {
    const response = await axios.get(apiUrl)
    const data = response.data
    return data
  } catch (error) {
    console.log("ERROR API NOTAS")
  }
}

module.exports = { apiPlaca, apiMPFN, apiNotas };
