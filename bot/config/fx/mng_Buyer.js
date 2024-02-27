const fs = require("fs");
const path = require("path");

const rangosFilePath = path.join(__dirname, "../rangos/rangos.json");
const rangosData = require(rangosFilePath);

function addBuyer(userId) {
  if (!rangosData.BUYER.includes(parseInt(userId, 10))) {
    rangosData.BUYER.push(parseInt(userId, 10));
    fs.writeFileSync(rangosFilePath, JSON.stringify(rangosData, null, 2));
  } else {
    console.log("El usuario ya está en el rango BUYER.");
  }
}

function delBuyer(userId) {
  const indexToDelete = rangosData.BUYER.indexOf(parseInt(userId, 10));
  if (indexToDelete > -1) {
    rangosData.BUYER.splice(indexToDelete, 1);
    fs.writeFileSync(rangosFilePath, JSON.stringify(rangosData, null, 2));
  } else {
    console.log("El usuario no está en el rango BUYER.");
  }
}
module.exports = {
  addBuyer,
  delBuyer,
};
