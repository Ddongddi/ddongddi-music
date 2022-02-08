const Discord = require('discord.js')
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_VOICE_STATES] })
const voice = require('@discordjs/voice')
const ytdl = require('ytdl-core-discord')
const yts = require('yt-search')
const searchlist = []
const playlist = []
const playerlist = []

client.once('ready', async () => {
    console.log('Ready!')
})

client.on('messageCreate', async message => {
    // if (message.content === '!deploy') {
        // const data = [{
        //     name: 'play',
        //     description: '음악을 재생합니다!',
        //     options: [{
        //         name: 'search',
        //         type: 'STRING',
        //         description: '음악 검색을 위한 검색어',
        //         required: true,
        //     }],
        // },
        // {
        //     name: 'stop',
        //     description: '음악을 정지합니다!'
        // },
        // {
        //     name: 'pause',
        //     description: '음악을 일시정지 시킵니다!'
        // },
        // {
        //     name: 'unpause',
        //     description: '음악을 다시 재생합니다!'
        // },
        // {
        //     name: 'sound',
        //     description: '음악의 소리를 조정합니다!',
        //     options: [{
        //         name: 'volume',
        //         type: 'INTEGER',
        //         description: '백분율을 기준으로 원하는 소리크기를 적어주세요!',
        //         required: true,
        //     }]

        // },
        // {
        //     name: 'serverstatus',
        //     description: '마인크래프트 서버상태를 알려줍니다!'
        // }
        // ]

        // const data = [{
        //     name: 'play',
        //     description: '음악을 재생합니다!',
        //     options: [
        //         {
        //             name: 'search',
        //             type: 'STRING',
        //             description: '음악 검색을 위한 검색어'
        //         },
        //         {
        //             name: 'link',
        //             type: 'STRING',
        //             description: '유튜브 음악 영상 링크'
        //         }
        //     ]
        // },
    //     {
    //         name: 'skip',
    //         description: '다음 음악으로 넘어갑니다!',
    //     },
    //     {
    //         name: 'stop',
    //         description: '음악봇을 정지시킵니다.',
    //     },
    //     {
    //         name: 'pause',
    //         description: '음악을 일시정지합니다!',
    //     },
    //     {
    //         name: 'resume',
    //         description: '일시정지를 해제합니다!',
    //     },
    //     {
    //         name: 'playlist',
    //         description: '재생목록을 표시합니다!',
        // }
    // ]

        // const commands = await client.application?.commands.set(data)
        // console.log(commands);
    // }
    // if (message.content === '!delete') {
        // await client.application?.commands.delete('서버_ID')
    // }
})

client.on('interactionCreate', async interaction => {
    if (interaction.commandName === 'play') {
        if (!interaction.member.voice.channel) return interaction.reply('음성채널에 참가해주세요!')
        await interaction.deferReply()
        const search = interaction.options.getString('search')
        const link = interaction.options.getString('link')
        if ((!search && !link) || (search && link)) return interaction.editReply('올바른 음악 검색어를 입력해주세요!')
        if (search) {
            const r = await yts(search)
            const videos = r.videos.slice(0, 5)
            searchlist[interaction.guildId] = []
            const select = new Discord.MessageSelectMenu()
                .setCustomId('select_music')
                .setPlaceholder('선택해주세요!')
            let i = 0
            videos.forEach(element => {
                searchlist[interaction.guildId].push({ server: interaction.guild.id, title: element.title, author: element.author.name, duration: element.timestamp, link: element.url })
                select.addOptions([
                    {
                        label: element.title,
                        description: '업로더: ' + element.author.name + ' - 재생시간: ' + element.timestamp,
                        value: i + '_value'
                    }
                ])
                i = i + 1
            });
            const row = new Discord.MessageActionRow()
                .addComponents(
                    select
                )
            global.searchlist = searchlist
            await interaction.editReply({ content: '노래를 선택해주세요!', components: [row] })
        }
        if (link) {
            if (!interaction.member.voice.channel) return interaction.editReply('음성채널에 참가해주세요!')

            if (link.includes('www.youtube.com')) {
                const video_code = link.replace('https://www.youtube.com/watch?v=', '')
                global.video_code = video_code
            } else if (link.includes('m.youtube.com')) {
                const video_code = link.replace('https://m.youtube.com/watch?v=', '')
                global.video_code = video_code
            } else if (link.includes('youtu.be')) {
                const video_code = link.replace('https://youtu.be/', '')
                global.video_code = video_code
            } else return interaction.editReply({ content: '링크가 올바르지 않아요!' })

            if (!playlist[interaction.guildId]) {
                playlist[interaction.guildId] = []
            }

            const video = await yts({ videoId: video_code })
            playlist[interaction.guildId].push({ title: video.title, author: video.author.name, link: video.url })
            await interaction.editReply({ content: '정상적으로 ' + video.title + '를 추가했습니다.'})

            if (!voice.getVoiceConnection(interaction.guildId)) {
                const connection = voice.joinVoiceChannel({
                    channelId: interaction.member.voice.channelId,
                    guildId: interaction.guildId,
                    adapterCreator: interaction.guild.voiceAdapterCreator
                })
                const player = voice.createAudioPlayer({
                    behaviors: {
                        noSubscriber: voice.NoSubscriberBehavior.Pause,
                    }
                })
                var resource = voice.createAudioResource(await ytdl(`${playlist[interaction.guildId][0].link}`, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 }))
                playlist[interaction.guildId].shift()
                player.play(resource)
                connection.subscribe(player)
                player.on(voice.AudioPlayerStatus.Idle, async () => {
                    if (playlist[interaction.guildId] == 0) return connection.destroy()
                    var resource = voice.createAudioResource(await ytdl(`${playlist[interaction.guildId][0].link}`, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 }))
                    player.play(resource);
                    playlist[interaction.guildId].shift()
                });
            }
        }
    }

    if (interaction.customId === 'select_music') {
        if (!interaction.member.voice.channel) return interaction.reply('음성채널에 참가해주세요!')
        if (!playlist[interaction.guildId]) {
            playlist[interaction.guildId] = []
        }
        const num = Number(interaction.values[0].replace('_value', ''))
        const searched = searchlist[interaction.guildId]
        playlist[interaction.guildId].push({ title: searched[num].title, author: searched[num].author, link: searched[num].link })
        await interaction.update({ content: '정상적으로 ' + searched[num].title + '를 추가했습니다.', components: [] })

        if (!voice.getVoiceConnection(interaction.guildId)) {
            const connection = voice.joinVoiceChannel({
                channelId: interaction.member.voice.channelId,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator
            })
            const player = voice.createAudioPlayer({
                behaviors: {
                    noSubscriber: voice.NoSubscriberBehavior.Pause,
                }
            })
            var resource = voice.createAudioResource(await ytdl(`${playlist[interaction.guildId][0].link}`, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 }))
            player.play(resource)
            connection.subscribe(player)
            playerlist[interaction.guildId] = player
            connection.on(voice.VoiceConnectionStatus.Disconnected, (oldState, newState) => {
                connection.destroy()
                playlist[interaction.guildId] = []
            });
            player.on(voice.AudioPlayerStatus.Idle, async () => {
                playlist[interaction.guildId].shift()
                if (playlist[interaction.guildId] == 0) return connection.destroy()
                var resource = voice.createAudioResource(await ytdl(`${playlist[interaction.guildId][0].link}`, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 }))
                player.play(resource);
            });
        }
    }
    if (interaction.commandName === 'pause') {
        const connection = voice.getVoiceConnection(interaction.guildId)
        if (!connection) return interaction.reply({content: '재생중인 노래가 없어요!'})
        playerlist[interaction.guildId].pause()
        interaction.reply({content: '노래를 일시정지 시켰습니다!'})
    }
    if (interaction.commandName === 'resume') {
        const connection = voice.getVoiceConnection(interaction.guildId)
        if (!connection) return interaction.reply({content: '재생중인 노래가 없어요!'})
        plaeyrlist[interaction.guildId].unpause()
        interaction.reply({content: '노래를 다시 재생시켰습니다!'})
    }
    if (interaction.commandName === 'skip') {
        const connection = voice.getVoiceConnection(interaction.guildId)
        if (!connection) return interaction.reply({content: '재생중인 노래가 없어요!'})
        if (playlist[interaction.guildId] == 0) {
            connection.destroy()
            return interaction.reply({content: '다음 노래가 없어 음성채널에서 나갔습니다!'})
        }
        playlist[interaction.guildId].shift()
        var resource = voice.createAudioResource(await ytdl(`${playlist[interaction.guildId][0].link}`, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 }))
        playerlist[interaction.guildId].play(resource)
        interaction.reply({content: '다음 노래로 넘어갔습니다!'})
    }
    if (interaction.commandName === 'stop') {
        const connection = voice.getVoiceConnection(interaction.guildId)
        if (!connection) return interaction.reply({content: '재생중인 노래가 없어요!'})
        connection.destroy()
        playlist[interaction.guildId] = []
        interaction.reply({content: '재생목록을 리셋시켰고, 음성채널에서 나갔습니다!'})
    }
    if (interaction.commandName === 'playlist') {
        if (!playlist[interaction.guildId]) return interaction.reply({content: '재생목록이 없어요!'})
        var list = ''
        for (var i = 0; i < playlist[interaction.guildId].length; i++) {
            list += `${i + 1}. ${playlist[interaction.guildId][i].title}\n`
        }
        interaction.reply({content: list})
    }
})

client.login('봇_토큰')