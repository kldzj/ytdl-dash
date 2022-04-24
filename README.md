Generates DASH manifests for YouTube videos using data from [`ytdl-core`](https://www.npmjs.com/package/ytdl-core).

## Installation

Using yarn:

```sh-session
$ yarn add ytdl-core @kldzj/ytdl-dash
```

Using npm:

```sh-session
$ npm i -S ytdl-core @kldzj/ytdl-dash
```

## Usage

```typescript
import ytdl from 'ytdl-core';
import { generateDASHFromVideoInfo } from '@kldzj/ytdl-dash';

const video = await ytdl.getInfo('dQw4w9WgXcQ');
const manifest = generateDASHFromVideoInfo(video); // dash-xml string
```

### Options

```typescript
import ytdl from 'ytdl-core';
import { generateDASHFromVideoInfo } from '@kldzj/ytdl-dash';

const video = await ytdl.getInfo('dQw4w9WgXcQ');
const manifest = generateDASHFromVideoInfo(video, {
  // replace all IPs in the media URLs
  replaceIPs: true,
});
```

## Credits

Thanks to [FreeTubeApp](https://github.com/FreeTubeApp) for their [yt-dash-manifest-generator](https://github.com/FreeTubeApp/yt-dash-manifest-generator/) package.
