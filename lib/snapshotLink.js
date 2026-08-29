'use strict';

function createSnapshotLink(syno, cameraId, videoCodec) {
    let sid = syno.sessions.SurveillanceStation ? syno.sessions.SurveillanceStation._sid : '';
    if (typeof sid === 'undefined') {
        sid = syno.sessions.SurveillanceStation;
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
