'use strict';

function createSnapshotLink(syno, cameraId, videoCodec, camera, config) {
    let sid = syno.sessions.SurveillanceStation ? syno.sessions.SurveillanceStation._sid : '';
    if (typeof sid === 'undefined') {
        sid = syno.sessions.SurveillanceStation;
    }
    let reolinkConfig = null;
    if (config && camera && camera.name && config.reolinkCameras) {
        try {
            const cameras = typeof config.reolinkCameras === 'string' ? JSON.parse(config.reolinkCameras) : config.reolinkCameras;
            reolinkConfig = cameras[camera.name];
        } catch (error) {
            // Invalid optional configuration falls back to the regular URL.
        }
    }
    // Keep the old global fields as a backwards-compatible fallback.
    if (!reolinkConfig && config && config.reolinkSnapshotFallback) {
        reolinkConfig = config;
    }
    if ((videoCodec === 'H265' || videoCodec === 'H265+') && reolinkConfig && reolinkConfig.enabled !== false && reolinkConfig.reolinkLogin && reolinkConfig.reolinkPassword && camera && camera.host) {
        const protocol = reolinkConfig.reolinkHttps ? 'https' : 'http';
        const port = Number.isInteger(Number(reolinkConfig.reolinkPort)) ? Number(reolinkConfig.reolinkPort) : (reolinkConfig.reolinkHttps ? 443 : 80);
        const channel = Number.isInteger(Number(reolinkConfig.reolinkChannel)) ? Number(reolinkConfig.reolinkChannel) : 0;
        return `${protocol}://${camera.host}:${port}/cgi-bin/api.cgi?cmd=Snap&channel=${channel}&rs=ioBroker&user=${encodeURIComponent(reolinkConfig.reolinkLogin)}&password=${encodeURIComponent(reolinkConfig.reolinkPassword)}`;
    }
    // Surveillance Station 9 exposes the H.265-compatible snapshot endpoint
    // with the newer `id`/`profileType` parameters. Keep the legacy URL for
    // all other codecs to avoid changing existing installations.
    if (videoCodec === 'H265' || videoCodec === 'H265+') {
        return `${syno.protocol}://${syno.host}:${syno.port}/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&method=GetSnapshot&version=9&id=${cameraId}&profileType=1&_sid=${sid}`;
    }
    return `${syno.protocol}://${syno.host}:${syno.port}/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&method=GetSnapshot&version=7&cameraId=${cameraId}&_sid=${sid}`;
}

module.exports = { createSnapshotLink };
