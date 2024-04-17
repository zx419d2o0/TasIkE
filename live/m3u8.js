const parser = require('iptv-playlist-parser');
const fs = require('fs');
const { channel } = require('diagnostics_channel');


const urls = [
  'https://hub.gitmirror.com/https://raw.githubusercontent.com/YanG-1989/m3u/main/Gather.m3u',
  // 'https://hub.gitmirror.com/https://raw.githubusercontent.com/YueChan/Live/main/IPTV.m3u',
  'https://hub.gitmirror.com/https://raw.githubusercontent.com/Ftindy/IPTV-URL/main/bestv.m3u',
  'https://hub.gitmirror.com/https://raw.githubusercontent.com/BigBigGrandG/IPTV-URL/release/Gather.m3u',
  'https://hub.gitmirror.com/https://raw.githubusercontent.com/BurningC4/Chinese-IPTV/master/TV-IPV4.m3u',
  // 'https://gist.githubusercontent.com/inkss/0cf33e9f52fbb1f91bc5eb0144e504cf/raw/ipv6.m3u',
  'https://live.fanmingming.com/tv/m3u/ipv6.m3u',
  'https://hub.gitmirror.com/https://raw.githubusercontent.com/Slive8/iTV/main/Slive.m3u'
]

const show_groups = ['央视','咪咕','体育直播','数字','卫视','地区','港澳台','YouTube','广播','国际','韩国','日本']

const get_m3u_list = async (url) => {
	const result = await fetch(url)
  .then(async response => {
    const playlist = await response.text()
    const result = parser.parse(playlist)
    const regex = /CCTV[^0-9]*5(?!\+)/i;
    console.log(url.split("/").slice(-4).join('/'), '\u21B4')
    result.items.forEach(channel => {
      if (regex.test(channel.name)){
        console.log(channel.url)
      }
    })
    return result
  })
  
  return result
}

const filter_channel = (channel) =>{
  const arr_filter = [" ", "-"]
  const arr_cut_head = ["•"]
  const arr_cut_foot = ["「","(","ʰ","频道"]
  arr_filter.forEach(item => {
    channel.name = channel.name.replace(item,'')
    channel.group.title = channel.group.title.replace(item, '')
  })
  arr_cut_head.forEach(item => {
    if (channel.name.includes(item) && channel.name.indexOf(item)<2){
      channel.name = channel.name.substring(channel.name.indexOf(item)+1)
    }
    if (channel.group.title.includes(item) && channel.group.title.indexOf(item)<2){
      channel.group.title = channel.group.title.substring(channel.group.title.indexOf(item)+1)
    }
  })
  arr_cut_foot.forEach(item => {
    if (channel.name.includes(item) && channel.name.indexOf(item)>1){
      channel.name = channel.name.substring(0, channel.name.indexOf(item))
    }
    if (channel.group.title.includes(item) && channel.group.title.indexOf(item)>1){
      channel.group.title = channel.group.title.substring(0, channel.group.title.indexOf(item))
    }
  })

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
    try{ 
      let data = await get_m3u_list(url)
        channels = [...channels, ...data.items]
      } catch (err){ 
        console.error(err, url); 
    } 
  }
  console.log('更新', channels.length)

  const playlist = fs.createWriteStream('dist/tv.m3u8', { flags: 'w' })

  playlist.write('#EXTM3U x-tvg-url="https://hub.gitmirror.com/https://github.com/botallen/epg/releases/download/latest/epg.xml"')

  channels = channels.filter((channel, index, self) => {
    return self.findIndex(item => item.url === channel.url) === index;
});

  channels = channels.filter(channel => {
    const new_ch = filter_channel(channel)
    for (const group of show_groups){
      if (new_ch.group.title.includes(group)){
        return new_ch
      }
    }
  })
  console.log('写入', channels.length)

  channels.sort((a, b) => {
    if (show_groups.indexOf(a.group.title) > show_groups.indexOf(b.group.title)) return 1
    if (show_groups.indexOf(a.group.title) < show_groups.indexOf(b.group.title)) return -1
    if (a.name.search(/\d+/g) == -1 && b.name.search(/\d+/g) != -1) return 1
    if (b.name.search(/\d+/g) == -1 && a.name.search(/\d+/g) != -1) return -1
    return a.name.match(/\d+/g) - b.name.match(/\d+/g)
  })

  for (let channel of channels) {
    playlist.write(`

#EXTINF:-1 group-title="${channel.group.title}" tvg-logo="${channel.tvg.logo}",${channel.name}
${channel.url}`)
  }

  playlist.end()
})()
