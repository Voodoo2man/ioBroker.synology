'use strict';

const { expect } = require('chai');
const { createSnapshotLink, findSnapshotCameraConfig, normalizeSnapshotCameras } = require('./snapshotLink.js');

describe('snapshotLink', () => {
    it('uses the current camera id without whitespace', () => {
        const link = createSnapshotLink({ protocol: 'https', host: 'nas', port: 5001, sessions: { SurveillanceStation: { _sid: 'sid' } } }, 42);
        expect(link).to.equal('https://nas:5001/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&method=GetSnapshot&version=7&cameraId=42&_sid=sid');
    });

    it('uses the Surveillance Station 9 endpoint for H.265', () => {
        const link = createSnapshotLink({ protocol: 'https', host: 'nas', port: 5001, sessions: { SurveillanceStation: { _sid: 'sid' } } }, 42, 'H265');
        expect(link).to.equal('https://nas:5001/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&method=GetSnapshot&version=9&id=42&profileType=1&_sid=sid');
    });

    it('uses the Surveillance Station 9 endpoint for H.265+', () => {
        const link = createSnapshotLink({ protocol: 'https', host: 'nas', port: 5001, sessions: { SurveillanceStation: { _sid: 'sid' } } }, 42, 'H265+');
        expect(link).to.include('version=9&id=42&profileType=1');
    });

    it('uses the direct Reolink JPEG endpoint for configured cameras regardless of codec', () => {
        const link = createSnapshotLink(
            { protocol: 'https', host: 'nas', port: 5001, sessions: { SurveillanceStation: { _sid: 'sid' } } },
            42,
            'H265',
            { vendor: 'Reolink', host: '192.168.1.50', port: 80 },
            { snapshotCameras: [{ camera: 'Terrasse', source: 'reolink', login: 'viewer', password: 'secret', port: 80, channel: 0 }] },
        );
        expect(link).to.equal('http://192.168.1.50:80/cgi-bin/api.cgi?cmd=Snap&channel=0&rs=ioBroker&user=viewer&password=secret');
    });

    it('does not use a camera configuration belonging to another Synology instance', () => {
        const link = createSnapshotLink(
            { protocol: 'https', host: 'nas', port: 5001, sessions: { SurveillanceStation: { _sid: 'sid' } } },
            42,
            'H264',
            { name: 'Terrasse', host: '192.168.1.50' },
            { snapshotCameras: [{ camera: 'synology.1.SurveillanceStation.cameras.Terrasse', source: 'reolink', login: 'viewer', password: 'secret' }] },
            'synology.0',
        );
        expect(link).to.include('webapi/entry.cgi');
        expect(link).to.not.include('cgi-bin/api.cgi');
    });

    it('selects Reolink settings per camera name', () => {
        const link = createSnapshotLink(
            { protocol: 'https', host: 'nas', port: 5001, sessions: { SurveillanceStation: { _sid: 'sid' } } },
            42,
            'H265',
            { name: 'Terrasse', host: '192.168.1.50' },
            { snapshotCameras: [{ camera: 'Terrasse', source: 'reolink', login: 'viewer', password: 'secret', port: 80, channel: 0 }] },
        );
        expect(link).to.include('192.168.1.50:80/cgi-bin/api.cgi?cmd=Snap&channel=0');
    });

    it('parses the JSON string saved by the admin configuration', () => {
        const link = createSnapshotLink(
            { protocol: 'https', host: 'nas', port: 5001, sessions: { SurveillanceStation: { _sid: 'sid' } } },
            42,
            'H264',
            { name: 'Parkplatz', host: '192.168.1.50' },
            { snapshotCameras: JSON.stringify([{ camera: 'Parkplatz', source: 'reolink', login: 'viewer', password: 'secret' }]) },
            'synology.0',
        );
        expect(link).to.include('192.168.1.50:80/cgi-bin/api.cgi?cmd=Snap&channel=0');
    });

    it('finds only the configured camera from the current Synology instance', () => {
        const config = {
            snapshotCameras: JSON.stringify([
                { camera: 'synology.1.SurveillanceStation.cameras.Parkplatz', source: 'reolink', login: 'wrong', password: 'wrong' },
                { camera: 'synology.0.SurveillanceStation.cameras.Parkplatz', source: 'reolink', login: 'right', password: 'right' },
            ]),
        };
        expect(findSnapshotCameraConfig(config, {name: 'Parkplatz'}, 'synology.0').login).to.equal('right');
        expect(normalizeSnapshotCameras(config)).to.have.length(2);
    });
});
