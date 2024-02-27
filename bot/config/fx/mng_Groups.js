const fs = require("fs");
const path = require("path");

const gruposPermitidosPath = path.join(
  __dirname,
  "../gruposManager/gruposPermitidos.js"
);
const gruposInfo = require(gruposPermitidosPath);

const gruposBloqueadosPath = path.join(
  __dirname,
  "../gruposManager/gruposBloqueados.js"
);
const grupoBlockInfo = require(gruposBloqueadosPath);

function permitirGrupo(grupoAdd) {
  const grupoId = parseInt(grupoAdd, 10);

  // Verificar si el grupo ya está en la lista
  if (!gruposInfo.includes(grupoId)) {
    // Agregar el nuevo ID de grupo al arreglo
    gruposInfo.push(grupoId);

    // Escribir la lista actualizada de grupos permitidos en el archivo
    fs.writeFileSync(
      gruposPermitidosPath,
      `module.exports = ${JSON.stringify(gruposInfo)};`,
      "utf-8"
    );

    console.log(
      `Se ha agregado el grupo ${grupoId} a la lista de grupos permitidos.`
    );
  } else {
    console.log(
      `El grupo ${grupoId} ya está en la lista de grupos permitidos.`
    );
  }
}

function eliminarGrupo(grupoDel) {
  const grupoId = parseInt(grupoDel, 10);

  // Verificar si el grupo está en la lista
  const grupoIndex = gruposInfo.indexOf(grupoId);
  if (grupoIndex !== -1) {
    // Eliminar el grupo de la lista
    gruposInfo.splice(grupoIndex, 1);

    // Escribir la lista actualizada de grupos permitidos en el archivo
    fs.writeFileSync(
      gruposPermitidosPath,
      `module.exports = ${JSON.stringify(gruposInfo)};`,
      "utf-8"
    );

    console.log(
      `Se ha eliminado el grupo ${grupoId} de la lista de grupos permitidos.`
    );
  } else {
    console.log(
      `El grupo ${grupoId} no está en la lista de grupos permitidos.`
    );
  }
}

function grupoBloqueado(addGroupBlock) {
  const grupoId = parseInt(addGroupBlock, 10);

  // Verificar si el grupo ya está en la lista de grupos bloqueados
  if (!grupoBlockInfo.includes(grupoId)) {
    // Agregar el nuevo ID de grupo bloqueado al arreglo
    grupoBlockInfo.push(grupoId);

    // Escribir la lista actualizada de grupos bloqueados en el archivo
    fs.writeFileSync(
      gruposBloqueadosPath,
      `module.exports = ${JSON.stringify(grupoBlockInfo)};`,
      "utf-8"
    );

    console.log(
      `Se ha agregado el grupo ${grupoId} a la lista de grupos bloqueados.`
    );
  } else {
    console.log(
      `El grupo ${grupoId} ya está en la lista de grupos bloqueados.`
    );
  }
}

module.exports = {
  permitirGrupo,
  eliminarGrupo,
  grupoBloqueado,
};
