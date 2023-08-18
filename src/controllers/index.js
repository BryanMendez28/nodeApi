exports.get = (req,res)=>{
    req.getConnection((err,conn)=>{
        if (err) return res.send(err);


        conn.query(`SELECT COUNT(*) AS TotalRegistros
        FROM nayax_transacciones`, (err,result)=>{
            if (err) return res.send(err);
            res.send(result);

        })
    }
  
    )
}

exports.getTabla = async (req, res) => {
    let {
      fechaInicio ,
      fechaFin ,
      horaInicio ,
      horaFin ,
      cliente_id ,
    } = req.query;
  
    req.getConnection((err, conn) => {
      if (err) return res.send(err);
  
      const query = `
      SELECT 
      A.ProductCodeInMap,
      COUNT(*) AS TotalRegistros,
      SUM(CASE WHEN A.PaymentMethodId = 1 THEN 1 ELSE 0 END) AS TotalRegistrosTarjetaCredito,
      SUM(CASE WHEN A.PaymentMethodId = 3 THEN 1 ELSE 0 END) AS TotalRegistrosEfectivo,
      SUM(CASE WHEN A.PaymentMethodId = 1 THEN 
               CAST(SeValue AS DECIMAL(10, 2)) - CAST(SUBSTRING(ExtraCharge, 1, LENGTH(ExtraCharge) - 2) AS DECIMAL(10, 2))
               ELSE 0 
          END) AS TotalGastadoTarjetaCredito,
      SUM(CASE WHEN A.PaymentMethodId = 3 THEN CAST(SeValue AS DECIMAL(10, 2)) ELSE 0 END) AS TotalGastadoEfectivo,
       SUM(CASE WHEN A.PaymentMethodId = 1 THEN 
               CAST(SeValue AS DECIMAL(10, 2)) - CAST(SUBSTRING(ExtraCharge, 1, LENGTH(ExtraCharge) - 2) AS DECIMAL(10, 2))
               ELSE 0 
          END) +
      SUM(CASE WHEN A.PaymentMethodId = 3 THEN CAST(SeValue AS DECIMAL(10, 2)) ELSE 0 END) AS TotalCosto
    FROM nayax_transacciones A 
    JOIN nayax_temp B ON B.id= A.cliente_id
    WHERE A.MachineSeTimeDateOnly BETWEEN ? AND ?
          AND A.MachineSeTimeTimeOnly BETWEEN ? AND ? 
          AND B.nombre Like ?
    GROUP BY A.ProductCodeInMap;
      `;
  
      conn.query(query, [fechaInicio, fechaFin, horaInicio, horaFin, `${cliente_id}%`], (err, result) => {
        if (err) return res.send(err);
        res.send(result);
      });
    });
  };
  


exports.getTablaTotal = async (req, res) => {
  let {
    fechaInicio ,
    fechaFin ,
    horaInicio ,
    horaFin ,
    cliente_id ,
  } = req.query;

  req.getConnection((err, conn) => {
    if (err) return res.send(err);

    const query = `
   
  SELECT
  SUM(TotalRegistros) AS SumaTotalRegistros,
  SUM(TotalRegistrosTarjetaCredito) AS SumaTotalRegistrosTarjetaCredito,
  SUM(TotalRegistrosEfectivo) AS SumaTotalRegistrosEfectivo,
  SUM(TotalGastadoTarjetaCredito) AS SumaTotalGastadoTarjetaCredito,
  SUM(TotalGastadoEfectivo) AS SumaTotalGastadoEfectivo,
  SUM(TotalCosto) AS SumaTotalCosto
FROM (
  SELECT 
    A.ProductCodeInMap,
    COUNT(*) AS TotalRegistros,
    SUM(CASE WHEN A.PaymentMethodId = 1 THEN 1 ELSE 0 END) AS TotalRegistrosTarjetaCredito,
    SUM(CASE WHEN A.PaymentMethodId = 3 THEN 1 ELSE 0 END) AS TotalRegistrosEfectivo,
    SUM(CASE WHEN A.PaymentMethodId = 1 THEN SeValue ELSE 0 END) AS TotalGastadoTarjetaCredito,
    SUM(CASE WHEN A.PaymentMethodId = 3 THEN SeValue ELSE 0 END) AS TotalGastadoEfectivo,
    SUM(SeValue) AS TotalCosto
  FROM nayax_transacciones A 
  JOIN nayax_temp B ON B.id= A.cliente_id
  WHERE A.MachineSeTimeDateOnly BETWEEN ? AND ?
    AND A.MachineSeTimeTimeOnly BETWEEN ? AND ? 
    AND B.nombre LIKE ? 
  GROUP BY A.ProductCodeInMap
) AS Subconsulta;
    `;

    conn.query(query, [fechaInicio, fechaFin, horaInicio, horaFin, `${cliente_id}%`], (err, result) => {
      if (err) return res.send(err);
      res.send(result);
    });
  });
};

exports.getTotal = async (req, res) => {
    // Intenta imprimir los parámetros que estás recibiendo para asegurarte de que son correctos
    console.log(req.query);
  
    const {
      fechaInicio,
      fechaFin, 
      horaInicio,
      horaFin,
      nombreMaquinaFiltro,
      codeProductFiltro
    } = req.query;
  
    req.getConnection((err, conn) => {
      if (err) {
        console.error('Error connecting to database:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      const queryTotalGastadoTarjetaCredito = `
        SELECT SUM(A.SeValue) AS TotalGastadoTarjetaCredito
        FROM nayax_transacciones A
        JOIN nayax_temp B ON B.id = A.cliente_id
        WHERE A.MachineSeTimeDateOnly BETWEEN ? AND ?
          AND A.MachineSeTimeTimeOnly BETWEEN ? AND ?
          AND B.nombre LIKE ?
          AND A.ProductCodeInMap LIKE ?
          AND A.PaymentMethodId = 1
      `;
  
      const queryTotalGastadoEfectivo = `
        SELECT SUM(A.SeValue) AS TotalGastadoEfectivo
        FROM nayax_transacciones A
        JOIN nayax_temp B ON B.id = A.cliente_id
        WHERE A.MachineSeTimeDateOnly BETWEEN ? AND ?
          AND A.MachineSeTimeTimeOnly BETWEEN ? AND ?
          AND B.nombre LIKE ?
          AND A.ProductCodeInMap LIKE ?
          AND A.PaymentMethodId = 3
      `;
  
      const queryTotalPiezasVendidas = `
        SELECT COUNT(*) AS TotalPiezasVendidas
        FROM nayax_transacciones A
        JOIN nayax_temp B ON B.id = A.cliente_id
        WHERE A.MachineSeTimeDateOnly BETWEEN ? AND ?
          AND A.MachineSeTimeTimeOnly BETWEEN ? AND ?
          AND B.nombre LIKE ?
          AND A.ProductCodeInMap LIKE ?
      `;
  
      const queryTarjetaCredito = `
        SELECT COUNT(*) AS TotalTarjetaCredito
        FROM nayax_transacciones A
        JOIN nayax_temp B ON B.id = A.cliente_id
        WHERE A.MachineSeTimeDateOnly BETWEEN ? AND ?
          AND A.MachineSeTimeTimeOnly BETWEEN ? AND ?
          AND B.nombre LIKE ?
          AND A.ProductCodeInMap LIKE ?
          AND PaymentMethodId = 1
      `;
  
      const queryEfectivo = `
        SELECT COUNT(*) AS TotalEfectivo
        FROM nayax_transacciones A
        JOIN nayax_temp B ON B.id = A.cliente_id
        WHERE A.MachineSeTimeDateOnly BETWEEN ? AND ?
          AND A.MachineSeTimeTimeOnly BETWEEN ? AND ?
          AND B.nombre LIKE ?
          AND A.ProductCodeInMap LIKE ?
          AND PaymentMethodId = 3
      `;
  
      const queryTotalGastado = `
        SELECT SUM(A.SeValue) AS TotalGastado
        FROM nayax_transacciones A
        JOIN nayax_temp B ON B.id = A.cliente_id
        WHERE A.MachineSeTimeDateOnly BETWEEN ? AND ?
          AND A.MachineSeTimeTimeOnly BETWEEN ? AND ?
          AND B.nombre LIKE ?
          AND A.ProductCodeInMap LIKE ?
      `;
  
      conn.query(
        queryTotalGastadoTarjetaCredito,
        [fechaInicio, fechaFin, horaInicio, horaFin, `%${nombreMaquinaFiltro}%`, `%${codeProductFiltro}%`],
        (errTotalGastadoTarjetaCredito, rowsTotalGastadoTarjetaCredito) => {
          if (errTotalGastadoTarjetaCredito) {
            console.error('Error executing query Total Gastado Tarjeta Crédito:', errTotalGastadoTarjetaCredito);
            return res.status(500).json({ error: 'Internal Server Error' });
          }
  
          conn.query(
            queryTotalGastadoEfectivo,
            [fechaInicio, fechaFin, horaInicio, horaFin, `%${nombreMaquinaFiltro}%`, `%${codeProductFiltro}%`],
            (errTotalGastadoEfectivo, rowsTotalGastadoEfectivo) => {
              if (errTotalGastadoEfectivo) {
                console.error('Error executing query Total Gastado Efectivo:', errTotalGastadoEfectivo);
                return res.status(500).json({ error: 'Internal Server Error' });
              }
  
              conn.query(
                queryTotalPiezasVendidas,
                [fechaInicio, fechaFin, horaInicio, horaFin, `%${nombreMaquinaFiltro}%`, `%${codeProductFiltro}%`],
                (errTotalPiezasVendidas, rowsTotalPiezasVendidas) => {
                  if (errTotalPiezasVendidas) {
                    console.error('Error executing query Total Piezas Vendidas:', errTotalPiezasVendidas);
                    return res.status(500).json({ error: 'Internal Server Error' });
                  }
  
                  conn.query(
                    queryTarjetaCredito,
                    [fechaInicio, fechaFin, horaInicio, horaFin, `%${nombreMaquinaFiltro}%`, `%${codeProductFiltro}%`],
                    (errTarjetaCredito, rowsTarjetaCredito) => {
                      if (errTarjetaCredito) {
                        console.error('Error executing query Tarjeta Crédito:', errTarjetaCredito);
                        return res.status(500).json({ error: 'Internal Server Error' });
                      }
  
                      conn.query(
                        queryEfectivo,
                        [fechaInicio, fechaFin, horaInicio, horaFin, `%${nombreMaquinaFiltro}%`, `%${codeProductFiltro}%`],
                        (errEfectivo, rowsEfectivo) => {
                          if (errEfectivo) {
                            console.error('Error executing query Efectivo:', errEfectivo);
                            return res.status(500).json({ error: 'Internal Server Error' });
                          }
  
                          conn.query(
                            queryTotalGastado,
                            [fechaInicio, fechaFin, horaInicio, horaFin, `%${nombreMaquinaFiltro}%`, `%${codeProductFiltro}%`],
                            (errTotalGastado, rowsTotalGastado) => {
                              if (errTotalGastado) {
                                console.error('Error executing query Total Gastado:', errTotalGastado);
                                return res.status(500).json({ error: 'Internal Server Error' });
                              }
  
                              // Procesa los resultados y crea el objeto de respuesta final
                              const totalGastadoTarjetaCredito = rowsTotalGastadoTarjetaCredito[0].TotalGastadoTarjetaCredito;
                              const totalGastadoEfectivo = rowsTotalGastadoEfectivo[0].TotalGastadoEfectivo;
                              const totalPiezasVendidas = rowsTotalPiezasVendidas[0].TotalPiezasVendidas;
                              const totalTarjetaCredito = rowsTarjetaCredito[0].TotalTarjetaCredito;
                              const totalEfectivo = rowsEfectivo[0].TotalEfectivo;
                              const totalGastado = rowsTotalGastado[0].TotalGastado;
  
                              const resultadoFinal = {
                                TotalTarjetaCredito: totalTarjetaCredito,
                                TotalEfectivo: totalEfectivo,
                                TotalPiezasVendidas: totalPiezasVendidas,
                                TotalGastado: totalGastado,
                                TotalGastadoTarjetaCredito: totalGastadoTarjetaCredito,
                                TotalGastadoEfectivo: totalGastadoEfectivo
                              };
  
                              res.json(resultadoFinal);
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  };