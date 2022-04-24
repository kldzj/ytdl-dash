import type { videoInfo, videoFormat } from 'ytdl-core';
import xml from 'xml-js';

interface Representation extends xml.Element {
  type: 'element';
  name: 'Representation';
  attributes: {
    id: string;
    codecs: string;
    bandwidth: string;
    width?: string;
    height?: string;
    frameRate?: string;
    maxPlayoutRate?: string;
  };
  elements: xml.Element[];
}

interface AdaptionSet extends xml.Element {
  type: 'element';
  name: 'AdaptionSet';
  attributes: {
    id: string;
    mimeType: string;
    startWithSAP: string;
    subsegmentAlignment: string;
  };
  elements: Array<Representation>;
}

export interface Options {
  minBufferTime?: number;
  replaceIPs?: boolean;
}

export function generateDASHFromVideoInfo(video: videoInfo, opts?: Options): string {
  const dash = xml.js2xml({
    declaration: {
      attributes: {
        version: '1.0',
        encoding: 'UTF-8',
      },
    },
    elements: [
      {
        type: 'element',
        name: 'MPD',
        attributes: {
          xmlns: 'urn:mpeg:dash:schema:mpd:2011',
          profiles: 'urn:mpeg:dash:profile:full:2011',
          type: 'static',
          minBufferTime: `PT${opts?.minBufferTime ?? 1.5}S`,
          mediaPresentationDuration: `PT${video.videoDetails.lengthSeconds}S`,
        },
        elements: [
          {
            type: 'element',
            name: 'Period',
            elements: generateAdaptionSets(video),
          },
        ],
      },
    ],
  });

  if (opts?.replaceIPs) {
    return dash.replace(
      /(ip(?:=|%3D|\/))((?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|[0-9a-f]{1,4}(?:(?::|%3A)[0-9a-f]{1,4}){7})/gi,
      '$10.0.0.0'
    );
  }

  return dash;
}

function generateAdaptionSets(video: videoInfo): Array<AdaptionSet> {
  const mimes: Record<string, videoFormat[]> = {}; // Key is mime type
  for (const format of video.formats) {
    if (format.hasAudio && format.hasVideo) continue;
    if (!format.initRange || !format.indexRange || !format.mimeType) continue;
    const mime = format.mimeType.split(';')[0];
    if (!mimes[mime]) mimes[mime] = [];
    mimes[mime].push(format);
  }

  const adaptions: AdaptionSet[] = [];
  for (let i = 0; i < Object.keys(mimes).length; i++) {
    const mime = Object.keys(mimes)[i];
    const formats = mimes[mime];
    const adaption: AdaptionSet = {
      type: 'element',
      name: 'AdaptionSet',
      attributes: {
        id: i.toString(),
        mimeType: mime,
        startWithSAP: '1',
        subsegmentAlignment: 'true',
      },
      elements: [],
    };

    for (const format of formats) {
      if (mime.startsWith('video/')) {
        adaption.elements.push(generateVideoRepresentation(format));
      } else {
        adaption.elements.push(generateAudioRepresentation(format));
      }
    }

    adaptions.push(adaption);
  }

  return adaptions;
}

function generateVideoRepresentation(format: videoFormat): Representation {
  return {
    type: 'element',
    name: 'Representation',
    attributes: {
      id: format.itag.toString(),
      codecs:
        format
          .mimeType!.split(' ')[1]
          .match(/"[^"]*/)?.[0]
          ?.substring(1) ?? '',
      bandwidth: format.bitrate?.toString() ?? '0',
      width: format.width?.toString(),
      height: format.height?.toString(),
      frameRate: format.fps?.toString(),
      maxPlayoutRate: '1',
    },
    elements: [
      {
        type: 'element',
        name: 'BaseURL',
        elements: [{ type: 'text', text: format.url }],
      },
      {
        type: 'element',
        name: 'SegmentBase',
        attributes: {
          indexRange: `${format.indexRange!.start}-${format.indexRange!.end}`,
        },
        elements: [
          {
            type: 'element',
            name: 'Initialization',
            attributes: {
              range: `${format.initRange!.start}-${format.initRange!.end}`,
            },
          },
        ],
      },
    ],
  };
}

function generateAudioRepresentation(format: videoFormat): Representation {
  return {
    type: 'element',
    name: 'Representation',
    attributes: {
      id: format.itag.toString(),
      codecs:
        format
          .mimeType!.split(' ')[1]
          .match(/"[^"]*/)?.[0]
          ?.substring(1) ?? '',
      bandwidth: format.bitrate?.toString() ?? '0',
    },
    elements: [
      {
        type: 'element',
        name: 'AudioChannelConfiguration',
        attributes: {
          schemeIdUri: 'urn:mpeg:dash:23003:3:audio_channel_configuration:2011',
          value: '2',
        },
      },
      {
        type: 'element',
        name: 'BaseURL',
        elements: [{ type: 'text', text: format.url }],
      },
      {
        type: 'element',
        name: 'SegmentBase',
        attributes: {
          indexRange: `${format.indexRange!.start}-${format.indexRange!.end}`,
        },
        elements: [
          {
            type: 'element',
            name: 'Initialization',
            attributes: {
              range: `${format.initRange!.start}-${format.initRange!.end}`,
            },
          },
        ],
      },
    ],
  };
}

export default generateDASHFromVideoInfo;
