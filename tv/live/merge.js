const parser = require('iptv-playlist-parser');
const fs = require('fs');


const m3us = [
  'https://hub.gitmirror.com/https://raw.githubusercontent.com/YanG-1989/m3u/main/Gather.m3u',
  'https://live.fanmingming.com/tv/m3u/ipv6.m3u',
  'https://hub.gitmirror.com/https://raw.githubusercontent.com/Slive8/iTV/main/Slive.m3u',
  'https://github.moeyy.xyz/https://raw.githubusercontent.com/Love4vn/love4vn/main/Sport.m3u',
  // 'https://4K.tvbox.中国',
]

const txts = [
  'https://histar.zapi.us.kg/?list',
  'http://www.52sw.top:678/play/oj1381/list.php?get=%E6%98%9F%E8%A7%86%E7%95%8C2%E7%BA%BF&t=' + Math.floor(Date.now()/1000 + 24*60*60),
  'https://fm1077.serv00.net/litv.txt',
  'https://raw.gitmirror.com/cysk003/ygbh66_test/master/tw.txt'
]

const get_m3u_list = async (url) => {
  const result = await fetch(url, {
    headers: {'User-Agent': 'okhttp/4.1.9'}
  })
  .then(async response => {
    const lines = await response.text()
    const arr_line = lines.split('\n')
    const extm3uIndex = arr_line.findIndex(line => line.startsWith('#EXTM3U'));
    const playlist = arr_line.slice(extm3uIndex).join('\n')
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
  
  return result.items
}

const get_txt_list = async (url) => {
  const result = await fetch(url, {
    headers: {'User-Agent': 'okhttp/4.1.9'}
  })
  .then(async response => {
    const content = await response.text()
    const lines = content.split('\n')
    let group_title = ''
    let channels = []
    for (const line of lines){
      arr_line = line.split(',')
      if (arr_line.length == 2){
        if (arr_line[1].trim() === '#genre#'){
          group_title = arr_line[0].trim()
        } else if (arr_line[1].includes('://')){
          channels.push({
            'group': {'title': group_title},
            'tvg': {'logo': ''},
            'name': arr_line[0],
            'url': arr_line[1],
          })
        }
      }
    }
    const regex = /CCTV[^0-9]*5(?!\+)/i;
    console.log(url.split("/").slice(-4).join('/'), '\u21B4')
    channels.forEach(channel => {
      if (regex.test(channel.name)){
        console.log(channel.url)
      }
    })
    return channels
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
    if (channel.name.replaceAll(' ','').includes('CCTV'+i)){
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
  // const diy_play = fs.readFileSync('youtube.m3u8', 'utf8')
  // let channels = parser.parse(diy_play).items
  let channels = []
  for (const url of m3us){
      try{ 
          let data = await get_m3u_list(url)
          channels = [...channels, ...data]
        } catch (err){ 
          console.error(err, url); 
      } 
  }
  for (const url of txts){
    try{ 
        let data = await get_txt_list(url)
        channels = [...channels, ...data]
      } catch (err){ 
        console.error(err, url); 
    } 
  }
  console.log('更新', channels.length)

  const playlist = fs.createWriteStream('tv.m3u8', { flags: 'w' })

  playlist.write('#EXTM3U')

  channels = channels.filter((channel, index, self) => {
    return self.findIndex(item => item.url === channel.url) === index;
});

  channels = channels.filter(channel => {
    return filter_channel(channel)
  })
  console.log('写入', channels.length)

  for (let channel of channels) {
    playlist.write(`

#EXTINF:-1 group-title="${channel.group.title}" tvg-logo="${channel.tvg.logo}",${channel.name}
${channel.url}`)
  }

  playlist.end()
})()
