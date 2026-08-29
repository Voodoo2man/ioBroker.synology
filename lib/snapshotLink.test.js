'use strict';

const { expect } = require('chai');
const { createSnapshotLink } = require('./snapshotLink.js');

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

    it('uses the direct Reolink JPEG endpoint for configured H.265 cameras', () => {
        const link = createSnapshotLink(
            { protocol: 'https', host: 'nas', port: 5001, sessions: { SurveillanceStation: { _sid: 'sid' } } },
            42,
            'H265',
            { vendor: 'Reolink', host: '192.168.1.50', port: 80 },
            { reolinkSnapshotFallback: true, reolinkLogin: 'viewer', reolinkPassword: 'secret', reolinkPort: 80, reolinkChannel: 0 },
        );
        expect(link).to.equal('http://192.168.1.50:80/cgi-bin/api.cgi?cmd=Snap&channel=0&rs=ioBroker&user=viewer&password=secret');
    });

    it('selects Reolink settings per camera name', () => {
        const link = createSnapshotLink(
            { protocol: 'https', host: 'nas', port: 5001, sessions: { SurveillanceStation: { _sid: 'sid' } } },
            42,
            'H265',
            { name: 'Terrasse', host: '192.168.1.50' },
            { reolinkCameras: JSON.stringify({ Terrasse: { enabled: true, reolinkLogin: 'viewer', reolinkPassword: 'secret', reolinkPort: 80, reolinkChannel: 0 } }) },
        );
        expect(link).to.include('192.168.1.50:80/cgi-bin/api.cgi?cmd=Snap&channel=0');
    });
});
