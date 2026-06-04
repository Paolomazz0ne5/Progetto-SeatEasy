const Database = require('better-sqlite3');
const db = new Database('database.db');

function getAvailableTablesForManual(idRistorante, date, time, pax) {
    const [h, m] = time.split(':').map(Number);
    const reqMinutes = h * 60 + m;

    const orari = db.prepare('SELECT idOrario, oraInizio, oraFine FROM Orario WHERE idRistorante = ?').all(idRistorante);
    
    let idOrario = null;
    for (const o of orari) {
      const [hI, mI] = o.oraInizio.split(':').map(Number);
      const [hF, mF] = o.oraFine.split(':').map(Number);
      const startMin = hI * 60 + mI;
      const endMin = hF * 60 + mF;
      const adjustedEnd = endMin < startMin ? endMin + 24 * 60 : endMin;
      const adjustedReq = (reqMinutes < startMin && endMin < startMin) ? reqMinutes + 24 * 60 : reqMinutes;

      if (adjustedReq >= startMin && adjustedReq <= adjustedEnd) {
        idOrario = o.idOrario;
        break;
      }
    }
    
    if (!idOrario && orari.length > 0) {
      idOrario = orari[0].idOrario;
    }
    
    if (!idOrario) return { success: false, error: 'Nessun orario configurato per questo ristorante.' };

    const turno = db.prepare('SELECT idTurno, durataMedia FROM Turno WHERE idOrario = ?').get(idOrario);
    if (!turno) return { success: false, error: 'Nessun turno configurato per questo orario.' };

    const idTurno = turno.idTurno;
    const durataMedia = turno.durataMedia || 90;

    const allTables = db.prepare(`
      SELECT T.idTavolo, T.numero, T.posti, S.nome as nomeSala
      FROM Tavolo T
      JOIN Sala S ON T.idSala = S.idSala
      WHERE S.idRistorante = ? AND T.posti >= ? AND T.stato != 'Non Disponibile'
    `).all(idRistorante, pax);

    let queryStr = `
      SELECT OT.idTavolo, P.dataPrenotazione
      FROM OccupazioneTavolo OT
      JOIN Prenotazione P ON OT.idPrenotazione = P.idPrenotazione
      WHERE P.idTurno = ? AND P.dataPrenotazione LIKE ? AND P.stato != 'Annullata'
    `;
    let queryParams = [idTurno, `${date}%`];

    const reservations = db.prepare(queryStr).all(...queryParams);

    const occupiedIds = new Set();
    const reqStart = reqMinutes;
    const reqEnd = reqStart + durataMedia;

    for (const res of reservations) {
      const resTimeStr = res.dataPrenotazione.includes(' ') ? res.dataPrenotazione.split(' ')[1] : null;
      if (!resTimeStr) {
        occupiedIds.add(res.idTavolo);
        continue;
      }
      const [hR, mR] = resTimeStr.split(':').map(Number);
      let resStart = hR * 60 + mR;
      
      if (resStart < 12 * 60 && reqStart > 18 * 60) resStart += 24 * 60; 
      
      const resEnd = resStart + durataMedia;
      if (reqStart < resEnd && reqEnd > resStart) {
        occupiedIds.add(res.idTavolo);
      }
    }

    const freeTables = allTables.filter(t => !occupiedIds.has(t.idTavolo));

    return { idTurno, freeTablesCount: freeTables.length, allCount: allTables.length, occupiedCount: occupiedIds.size, occupiedTables: Array.from(occupiedIds) };
}

console.log('Result:', getAvailableTablesForManual(2, '2026-06-04', '23:30', 2));
