"""
hr_client.py — Cliente BLE para captura de HR desde smartwatches.

Protocolo: BLE Heart Rate Service estándar (UUID 0x180D / 0x2A37).
Compatible con Samsung Galaxy Watch 7 en modo HR Broadcasting.

Uso típico:
    # Escanear dispositivos disponibles
    devices = asyncio.run(scan_hr_devices(timeout=10))

    # Conectar y transmitir a una sesión activa
    stop = start_hr_background(address, session, on_sample=print)
    # ... tiempo después ...
    stop.set()  # detiene el stream
"""

import asyncio
import struct
import threading
from typing import Optional, Callable, List
from loguru import logger

try:
    from bleak import BleakScanner, BleakClient
    from bleak.backends.device import BLEDevice
    from bleak.backends.scanner import AdvertisementData
    BLEAK_AVAILABLE = True
except ImportError:
    BLEAK_AVAILABLE = False
    logger.warning("bleak no disponible — instala con: pip install bleak==3.0.2")


# ─────────────────────────────────────────────
# Constantes BLE
# ─────────────────────────────────────────────

# Servicio estándar de frecuencia cardíaca (Bluetooth SIG)
HR_SERVICE_UUID = "0000180d-0000-1000-8000-00805f9b34fb"
# Característica HR Measurement — contiene el BPM + flags
HR_CHAR_UUID    = "00002a37-0000-1000-8000-00805f9b34fb"

# Fragmentos de nombre BLE de wearables Samsung conocidos
SAMSUNG_NAME_HINTS = ["galaxy watch", "samsung", "galaxy fit", "galaxy ring"]


# ─────────────────────────────────────────────
# Parsing del protocolo HR Measurement (0x2A37)
# ─────────────────────────────────────────────

def parse_hr_measurement(data: bytes) -> Optional[int]:
    """
    Parsea los bytes de la característica BLE Heart Rate Measurement (0x2A37).

    Estructura (Bluetooth SIG):
      Byte 0 — Flags:
        Bit 0:   formato del valor HR (0 = uint8, 1 = uint16)
        Bits 1-2: estado de contacto del sensor
        Bit 3:   energía gastada presente
        Bit 4:   intervalos RR presentes
      Bytes 1[–2]: valor de HR en BPM (uint8 o uint16 little-endian)

    Returns:
        BPM como int, o None si los datos son inválidos
    """
    if not data or len(data) < 2:
        logger.debug(f"HR data demasiado corto: {data!r}")
        return None

    flags = data[0]
    hr_format_uint16 = bool(flags & 0x01)

    if hr_format_uint16:
        if len(data) < 3:
            return None
        bpm = struct.unpack_from("<H", data, 1)[0]
    else:
        bpm = data[1]

    # Validación fisiológica básica
    if not (20 <= bpm <= 250):
        logger.warning(f"BPM fuera de rango fisiológico ({bpm}) — descartado")
        return None

    return bpm


# ─────────────────────────────────────────────
# Escaneo de dispositivos
# ─────────────────────────────────────────────

async def scan_hr_devices(timeout: float = 10.0) -> List[dict]:
    """
    Escanea dispositivos BLE que anuncian el servicio Heart Rate (0x180D).

    Activa HR Broadcasting en el Galaxy Watch 7 antes de escanear:
      Ajustes → Salud → Frecuencia cardíaca y estrés → Más →
      Transmisión de frecuencia cardíaca → Activar

    Returns:
        Lista de dicts con claves: 'address', 'name', 'rssi'
        Ordenada por intensidad de señal (RSSI, mayor = más cercano).
    """
    if not BLEAK_AVAILABLE:
        logger.error("bleak no disponible")
        return []

    logger.info(f"Escaneando BLE con Heart Rate Service ({timeout:.0f}s)...")
    found: dict = {}  # keyed by address para deduplicar

    def _on_detection(device: BLEDevice, adv: AdvertisementData):
        uuids_lower = {str(u).lower() for u in (adv.service_uuids or [])}
        if HR_SERVICE_UUID in uuids_lower:
            entry = {
                "address": device.address,
                "name":    device.name or "Desconocido",
                "rssi":    adv.rssi if adv.rssi else -999,
            }
            if device.address not in found:
                logger.info(
                    f"  [HR] {entry['name']:<28} {device.address}  "
                    f"RSSI: {entry['rssi']} dBm"
                )
            found[device.address] = entry

    scanner = BleakScanner(detection_callback=_on_detection)
    await scanner.start()
    await asyncio.sleep(timeout)
    await scanner.stop()

    result = sorted(found.values(), key=lambda d: d["rssi"], reverse=True)
    logger.info(f"Escaneo completo: {len(result)} dispositivo(s) HR encontrado(s)")
    return result


async def find_galaxy_watch(timeout: float = 10.0) -> Optional[dict]:
    """
    Busca automáticamente un Samsung Galaxy Watch con HR broadcasting activo.
    Si no encuentra Samsung, retorna el dispositivo HR con mejor señal.

    Returns:
        dict con 'address', 'name', 'rssi', o None
    """
    devices = await scan_hr_devices(timeout)
    if not devices:
        logger.warning(
            "Ningún dispositivo HR encontrado.\n"
            "  -> Verifica HR Broadcasting en el Galaxy Watch:\n"
            "     Ajustes > Salud > FC y estres > Mas > Transmision de FC"
        )
        return None

    # Preferir Samsung por nombre
    for d in devices:
        name_lower = (d["name"] or "").lower()
        if any(hint in name_lower for hint in SAMSUNG_NAME_HINTS):
            logger.info(f"Galaxy Watch encontrado: {d['name']} ({d['address']})")
            return d

    # Fallback: mejor señal disponible
    best = devices[0]
    logger.info(
        f"Galaxy Watch no identificado por nombre. "
        f"Usando dispositivo con mejor señal: {best['name']} ({best['address']})"
    )
    return best


# ─────────────────────────────────────────────
# Streaming de HR
# ─────────────────────────────────────────────

async def stream_hr(
    address: str,
    session,                              # BioSession
    on_sample: Optional[Callable[[int], None]] = None,
    stop_event: Optional[asyncio.Event] = None,
    reconnect: bool = True,
    reconnect_delay: float = 5.0,
):
    """
    Conecta a un dispositivo BLE y transmite muestras HR a la sesión activa.

    Cada notificación del reloj llama a session.add_hr_sample(bpm).
    Si la conexión se cae y reconnect=True, reintenta automáticamente.

    Args:
        address:         dirección BLE (formato XX:XX:XX:XX:XX:XX)
        session:         BioSession activa donde se registran las muestras
        on_sample:       callback opcional invocado con cada BPM recibido
        stop_event:      asyncio.Event para detener el loop externamente
        reconnect:       reintentar si la conexión se cae
        reconnect_delay: segundos entre intentos de reconexión
    """
    if not BLEAK_AVAILABLE:
        logger.error("bleak no disponible — instala con: pip install bleak==3.0.2")
        return

    if stop_event is None:
        stop_event = asyncio.Event()

    def _hr_handler(_sender, data: bytes):
        bpm = parse_hr_measurement(data)
        if bpm is None:
            return
        session.add_hr_sample(bpm)
        if on_sample:
            on_sample(bpm)

    async def _poll_stop():
        """Espera activamente el stop_event para poder cancelar el loop."""
        while not stop_event.is_set():
            await asyncio.sleep(0.3)

    while not stop_event.is_set():
        logger.info(f"Conectando BLE a {address}...")
        try:
            async with BleakClient(address) as client:
                if not client.is_connected:
                    raise ConnectionError(f"No se pudo conectar a {address}")

                logger.info(f"[BLE] Conectado a {address} — recibiendo HR")
                await client.start_notify(HR_CHAR_UUID, _hr_handler)

                # Mantener la conexión hasta stop o desconexión
                poll_task = asyncio.create_task(_poll_stop())
                while not stop_event.is_set() and client.is_connected:
                    await asyncio.sleep(0.5)
                poll_task.cancel()

                if client.is_connected:
                    await client.stop_notify(HR_CHAR_UUID)

                if stop_event.is_set():
                    logger.info("[BLE] Stream HR detenido por solicitud.")
                    return
                else:
                    logger.warning("[BLE] Conexion perdida.")

        except asyncio.CancelledError:
            logger.info("[BLE] Stream HR cancelado.")
            return
        except Exception as e:
            logger.error(f"[BLE] Error: {e}")

        if not reconnect or stop_event.is_set():
            break

        logger.info(f"[BLE] Reintentando en {reconnect_delay:.0f}s...")
        await asyncio.sleep(reconnect_delay)

    logger.info("[BLE] Stream HR finalizado.")


# ─────────────────────────────────────────────
# Integración con threading (para correr junto
# al bucle de detección de mesas en main.py)
# ─────────────────────────────────────────────

def start_hr_background(
    address: str,
    session,
    on_sample: Optional[Callable[[int], None]] = None,
    reconnect: bool = True,
) -> threading.Event:
    """
    Lanza el stream HR en un hilo de background (daemon).

    Permite correr captura BLE mientras el hilo principal monitorea procesos.
    El hilo se detiene limpiamente llamando stop_event.set().

    Args:
        address:   dirección BLE del dispositivo
        session:   BioSession activa
        on_sample: callback para cada muestra (ej: imprimir en consola)
        reconnect: reintentar reconexión si se cae

    Returns:
        threading.Event — llama .set() para detener el stream
    """
    stop_flag = threading.Event()

    def _thread_body():
        async def _run():
            # Convertir threading.Event a asyncio.Event
            async_stop = asyncio.Event()

            async def _watch_flag():
                while not stop_flag.is_set():
                    await asyncio.sleep(0.3)
                async_stop.set()

            watcher = asyncio.create_task(_watch_flag())
            try:
                await stream_hr(
                    address, session,
                    on_sample=on_sample,
                    stop_event=async_stop,
                    reconnect=reconnect,
                )
            finally:
                watcher.cancel()

        asyncio.run(_run())

    t = threading.Thread(target=_thread_body, daemon=True, name="hr-client")
    t.start()
    logger.info(f"[BLE] Hilo HR iniciado (address={address})")
    return stop_flag


def stop_hr_background(stop_flag: threading.Event):
    """Detiene el hilo HR de background de forma limpia."""
    if stop_flag:
        stop_flag.set()
        logger.info("[BLE] Solicitud de parada HR enviada.")
