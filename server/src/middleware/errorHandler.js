export function errorHandler(error, _req, res, _next) {
  if (error?.code === "P2025") {
    return res.status(404).json({ error: "Recurso no encontrado" });
  }

  if (error?.code === "P2002") {
    return res.status(409).json({ error: "Ya existe un registro con esos datos" });
  }

  console.error(error);
  return res.status(500).json({ error: "Error interno del servidor" });
}
