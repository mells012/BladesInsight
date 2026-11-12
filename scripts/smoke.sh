#!/usr/bin/env bash
# Prueba de humo contra un servidor ya levantado (por defecto http://localhost:3000).
# Uso: BASE=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... ./scripts/smoke.sh
B=${BASE:-http://localhost:3000}; J=$(mktemp)
E=${ADMIN_EMAIL:-admin@bladesinsight.local}; P=${ADMIN_PASSWORD:-Admin12345!}
fail=0
check() { # descripción, esperado, obtenido
  if [[ "$3" == *"$2"* ]]; then echo "  OK   $1"; else echo "  FAIL $1 (esperado '$2', obtenido '$3')"; fail=1; fi
}
code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

check "ruta /admin sin sesión redirige" 302 "$(code $B/admin/patinadoras)"
check "login correcto" 302 "$(code -c $J -d "email=$E&password=$P" $B/login)"
check "login incorrecto" 401 "$(code -d "email=$E&password=mala" $B/login)"
check "API sin sesión protegida" 401 "$(code $B/admin/api/patinadoras?pais=ECU)"
check "crear temporada" 302 "$(code -b $J -d 'nombre=2025/26&fechaInicio=2025-07-01&fechaFin=2026-06-30' $B/admin/temporadas)"
check "temporada inválida (servidor)" "Use el formato" "$(curl -s -b $J -d 'nombre=2025/30&fechaInicio=2025-07-01&fechaFin=2026-06-30' $B/admin/temporadas)"
check "código ISU inválido rechazado" "Formato inv" "$(curl -s -b $J -d 'nombre=Ana&apellido=Test&pais=ECU&fechaNacimiento=2005-03-01&isuId=12345' $B/admin/patinadoras)"
check "patinadora menor de 15 rechazada" "15 años" "$(curl -s -b $J -d 'nombre=Ana&apellido=Test&pais=ECU&fechaNacimiento=2020-03-01&isuId=ISU-999999' $B/admin/patinadoras)"
check "crear patinadora (ISU normalizado)" 302 "$(code -b $J -d 'nombre=Ana&apellido=Test&pais=ECU&fechaNacimiento=2005-03-01&isuId=isu-123456&activa=on' $B/admin/patinadoras)"
check "ISU duplicado rechazado" "ya está registrado" "$(curl -s -b $J -d 'nombre=Eva&apellido=Dup&pais=ECU&fechaNacimiento=2005-03-01&isuId=ISU-123456' $B/admin/patinadoras)"
check "cascada país→patinadoras" "Test, Ana" "$(curl -s -b $J "$B/admin/api/patinadoras?pais=ECU")"
check "crear programa planeado" 302 "$(code -b $J -d 'pais=ECU&patinadoraId=1&temporadaId=1&tipoPrograma=Corto' $B/admin/programas-planeados)"
check "cascada patinadora→programas" "2025/26" "$(curl -s -b $J "$B/admin/api/programas-planeados?patinadoraId=1")"
check "FK de otro país rechazada" "no pertenece al país" "$(curl -s -b $J -d 'pais=JPN&patinadoraId=1&temporadaId=1&tipoPrograma=Libre' $B/admin/programas-planeados)"
check "elemento: valorBase del cliente ignorado" 302 "$(code -b $J -d 'programaPlaneadoId=1&orden=2&codigo=3Lz%2B3T&valorBase=99' $B/admin/elementos-planeados)"
check "valor base calculado en servidor (10.10)" "10.10" "$(curl -s -b $J $B/admin/elementos-planeados)"
check "código de elemento desconocido" "no reconocido" "$(curl -s -b $J -d 'programaPlaneadoId=1&orden=3&codigo=9Z' $B/admin/elementos-planeados)"
check "bonus 2ª mitad solo en libre" "solo aplica" "$(curl -s -b $J -d 'programaPlaneadoId=1&orden=4&codigo=3F&segundaMitad=on' $B/admin/elementos-planeados)"
rm -f $J
exit $fail
