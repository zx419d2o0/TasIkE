const parser = require('iptv-playlist-parser');
const fs = require('fs')


const urls = [
  'https://hub.gitmirror.com/https://raw.githubusercontent.com/YanG-1989/m3u/main/Gather.m3u',
  'https://hub.gitmirror.com/https://raw.githubusercontent.com/whpsky/iptv/main/chinatv.m3u',
  'https://live.fanmingming.com/tv/m3u/ipv6.m3u',
  'https://hub.gitmirror.com/https://raw.githubusercontent.com/Slive8/iTV/main/Slive.m3u'
]

const show_groups = ['央视','卫视','数字','地区','咪咕','YouTube','港澳台','广播','国际','韩国','日本','体育直播']

const get_m3u_list = async (url) => {
	const result = await fetch(url)
  .then(async response => {
    const playlist = await response.text()
    const result = parser.parse(playlist)
    return result
  })
  
  return result
}

const filter_channel = (channel) =>{
  const arr_filter = [" ", "-", "*"]
  arr_filter.forEach(item => {
    channel.name = channel.name.replace(item,'')
  })
  if (channel.group.title.includes('•')){
    channel.group.title = channel.group.title.substring(channel.group.title.indexOf('•')+1)
  } 
  if(channel.group.title.includes('「')){
    channel.group.title = channel.group.title.substring(0, channel.group.title.indexOf('「'))
  }
  if(channel.group.title.includes('(')){
    channel.group.title = channel.group.title.substring(0, channel.group.title.indexOf('('))
  }
  if(channel.group.title.includes('频道')){
    channel.group.title = channel.group.title.substring(0, channel.group.title.indexOf('频道'))
  }

  const arr_spec = ['5+', '4K', '8K']
  for (let i=17;i>0;i--){
    if (channel.name.includes('CCTV'+i)){
      for (const item of arr_spec){
        if (channel.name.includes(item)){
          channel.name = 'CCTV'+item
          break
        }else{
          channel.name = 'CCTV'+i
          break
        }
      }
      channel.group.title = '央视'
      break
    }
  }
  
  return channel
}

( async ()=>{
  const diy_play = fs.readFileSync('dist/index.m3u8', 'utf8')
  let channels = parser.parse(diy_play).items
  for (let url of urls){
    let data = await get_m3u_list(url)
    channels = [...channels, ...data.items]
  }
  console.log('更新', channels.length)

  const playlist = fs.createWriteStream('dist/tv.m3u8', { flags: 'w' })

  playlist.write('#EXTM3U x-tvg-url="https://hub.gitmirror.com/https://github.com/botallen/epg/releases/download/latest/epg.xml"')

  channels = channels.filter(channel => {
    const new_ch = filter_channel(channel)
    for (const group of show_groups){
      if (new_ch.group.title.includes(group)){
        return new_ch
      }
    }
  })
  console.log('写入', channels.length)

  for (let channel of channels) {
    playlist.write(`

#EXTINF:-1 group-title="${channel.group.title}" tvg-logo="${channel.tvg.logo}", ${channel.name}
${channel.url}`)
  }

  playlist.end()
})()