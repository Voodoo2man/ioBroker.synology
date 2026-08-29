'use strict';

function normalizeSnapshotCameras(config) {
    let snapshotCameras = config && config.snapshotCameras;
    if (typeof snapshotCameras === 'string') {
        try {
            snapshotCameras = JSON.parse(snapshotCameras);
        } catch (e) {
            return [];
        }
    }
    return Array.isArray(snapshotCameras) ? snapshotCameras : [];
}

function findSnapshotCameraConfig(config, camera, namespace) {
    if (!camera || !camera.name) return null;
    return normalizeSnapshotCameras(config).find(item => {
        if (!item || item.source !== 'reolink') return false;
        const isObjectId = typeof item.camera === 'string' && item.camera.includes('.SurveillanceStation.cameras.');
        if (isObjectId && namespace && !item.camera.startsWith(`${namespace}.SurveillanceStation.cameras.`)) {
            return false;
        }
        const configuredCamera = isObjectId
            ? item.camera.split('.SurveillanceStation.cameras.').pop()
            : item.camera;
        return configuredCamera === camera.name;
    }) || null;
}

function createSnapshotLink(syno, cameraId, videoCodec, camera, config, namespace) {
    let sid = syno.sessions.SurveillanceStation ? syno.sessions.SurveillanceStation._sid : '';
    if (typeof sid === 'undefined') {
        sid = syno.sessions.SurveillanceStation;
    }
    let reolinkConfig = null;
    reolinkConfig = findSnapshotCameraConfig(config, camera, namespace);
    if (reolinkConfig && reolinkConfig.login && reolinkConfig.password && camera && camera.host) {
        const protocol = reolinkConfig.https ? 'https' : 'http';
        const port = Number.isInteger(Number(reolinkConfig.port)) ? Number(reolinkConfig.port) : (reolinkConfig.https ? 443 : 80);
        const channel = Number.isInteger(Number(reolinkConfig.channel)) ? Number(reolinkConfig.channel) : 0;
        return `${protocol}://${camera.host}:${port}/cgi-bin/api.cgi?cmd=Snap&channel=${channel}&rs=ioBroker&user=${encodeURIComponent(reolinkConfig.login)}&password=${encodeURIComponent(reolinkConfig.password)}`;
    }
    // Surveillance Station 9 exposes the H.265-compatible snapshot endpoint
    // with the newer `id`/`profileType` parameters. Keep the legacy URL for
    // all other codecs to avoid changing existing installations.
    if (videoCodec === 'H265' || videoCodec === 'H265+') {
        return `${syno.protocol}://${syno.host}:${syno.port}/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&method=GetSnapshot&version=9&id=${cameraId}&profileType=1&_sid=${sid}`;
    }
    return `${syno.protocol}://${syno.host}:${syno.port}/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&method=GetSnapshot&version=7&cameraId=${cameraId}&_sid=${sid}`;
}

module.exports = { createSnapshotLink, findSnapshotCameraConfig, normalizeSnapshotCameras };
