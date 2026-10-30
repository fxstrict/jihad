// نقاط الدخول العليا التي يشترطها Apps Script؛ لا منطق هنا — كله في JihadServer (Router).
function doGet(e) { return JihadServer.handleGet(e); }
function doPost(e) { return JihadServer.handlePost(e); }
