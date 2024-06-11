const fs = require('fs');
const { parse } = require('csv-parse/sync');


const parse_youtube_m3u8 = async (channel, playlist) => {
	await fetch(channel.url).then(async response => {
        const text = await response.text()
        let end = text.indexOf('.m3u8') + 5;
        let tuner = 100;
        let link = '';

        while (tuner < 1000) {
            if (text.substring(end - tuner, end).includes('https://')) {
                link = text.substring(end - tuner, end);
                const start = link.indexOf('https://');
                end = link.indexOf('.m3u8') + 5;
                link = link.substring(start, end);
                break;
            } else {
                tuner += 5;
            }
        }

        if (link === ''){
            console.log(channel.name, 'not found', channel.url)
        } else {
            channel.url = link;
            playlist.write_channel(channel);
        }
    })
  }

(async ()=> {
    const contents = fs.readFileSync('channels.csv', 'utf8')
    const channels = parse(contents, {
        columns: true,
        skip_empty_lines: true
    })
    const playlist = fs.createWriteStream('youtube.m3u8', { flags: 'w' })
    playlist.write('#EXTM3U')
//     playlist.write_channel = (channel) => {
//         playlist.write(`

// #EXTINF:-1 group-title="${channel.group}" tvg-logo="${channel.logo}", ${channel.name}
// ${channel.url}`)
//     }

    const promises = [];
    for (const channel of channels) {
        // if (channel.type === 'youtube') {
            const promise = parse_youtube_m3u8(channel, playlist)
        //     promises.push(promise)
        // } else {
        //     playlist.write_channel(channel)
        // }
    }
    await Promise.all(promises)
    playlist.end()
})()
