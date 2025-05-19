// 定义全局音乐列表变量
let music_list = [];
let isPlaying = false;
let audio = null;
let current_song = 0;
let progressInterval = null;
const progressBarLine = document.querySelector('.progress-bar-line');
const currentTimeDisplay = document.querySelector('.current-time');
const totalTimeDisplay = document.querySelector('.total-time');
// 初始化播放器的函数（会被外部调用）
function initMusicPlayer(data) {
    music_list = data;
    console.log('音乐列表已加载:', music_list);
    renderPlayer();
    initEventListeners(); // 初始化事件监听
}

// 暴露函数到全局
window.initMusicPlayer = initMusicPlayer;



// 渲染播放器
function renderPlayer() {
    const container = document.querySelector('.list-content');
    let html = '';

    music_list.forEach((song, index) => { // 添加索引参数
        html += `
            <li data-index="${index}">
                <div class="detail">
                    <img src="${song.cover}">
                    <div class="detail-content">
                        <div class="title">${song.name}</div>
                        <div class="artist">${song.singer}</div>
                    </div>
                </div>
                <div class="time">(${song.time})</div>
            </li>
        `;
    });

    html += '</ul>';
    container.innerHTML = html;
}

// 显示/隐藏播放列表
function togglePlayList() {
    const listWarp = document.querySelector('.list-warp');
    const maskBg = document.querySelector('.mask_bg');

    // 切换显示状态
    if (listWarp.style.display === 'block') {
        listWarp.style.display = 'none';
        maskBg.style.display = 'none';
    } else {
        listWarp.style.display = 'block';
        maskBg.style.display = 'block';
    }
}

// 关闭播放列表
function closePlayList() {
    document.querySelector('.list-warp').style.display = 'none';
    document.querySelector('.mask_bg').style.display = 'none';
}

// 绑定事件监听
function initEventListeners() {
    // 列表图标点击
    document.querySelector('.player-list').addEventListener('click', function (e) {
        e.stopPropagation(); // 阻止事件冒泡
        togglePlayList();
    });

    // 点击遮罩层关闭
    document.querySelector('.mask_bg').addEventListener('click', closePlayList);

    // 阻止列表区域点击冒泡
    document.querySelector('.list-warp').addEventListener('click', function (e) {
        e.stopPropagation();
    });

    // 播放/暂停按钮点击
    document.querySelector('.control').addEventListener('click', function (e) {
        const target = e.target.closest('.icon');
        if (!target) return;

        const iconType = target.querySelector('img').alt;
        switch (iconType) {
            case '播放':
            case '暂停':
                togglePlayPause();
                break;
            case '上一首':
                playPrev();
                break;
            case '下一首':
                playNext();
                break;
        }
    });
    // 播放列表点击事件（事件委托）
    document.querySelector('.list-content').addEventListener('click', function (e) {
        const listItem = e.target.closest('li[data-index]');
        if (!listItem) return;

        const index = parseInt(listItem.dataset.index);
        playSelectedSong(index);
    });

    // 添加进度条点击跳转功能
    document.querySelector('.progress-bar').addEventListener('click', (e) => {
        if (!audio) return;

        const rect = e.target.getBoundingClientRect();
        const clickPosition = (e.clientX - rect.left) / rect.width;
        audio.currentTime = clickPosition * audio.duration;
    });
}


function togglePlayPause(forcePlay = false) {
    const playBtn = document.querySelector('.icon img[alt="播放"], .icon img[alt="暂停"]');
    updatePlayer();
    if (!isPlaying || forcePlay) {
        if (!audio) {
            audio = new Audio(music_list[current_song].audio_url);
            // audio = null;
        }
        audio.pause();

        // 添加元数据加载监听
        audio.addEventListener('loadedmetadata', () => {
            totalTimeDisplay.textContent = formatTime(audio.duration);
        });

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', playNext);

        audio.play().catch(error => {
            console.error('播放失败:', error);
        });

        // 启动进度更新
        progressInterval = setInterval(updateProgress, 1000);

        playBtn.src = './static/img/1.png';
        playBtn.alt = '暂停';
        isPlaying = true;
        document.querySelector('.cover').style.animationPlayState = 'running';
    } else {
        audio.pause();
        clearInterval(progressInterval);
        playBtn.src = './static/img/5.png';
        playBtn.alt = '播放';
        isPlaying = false;
        document.querySelector('.cover').style.animationPlayState = 'paused';
    }
}

// 播放上一首
function playPrev() {
    current_song = (current_song - 1 + music_list.length) % music_list.length;
    updatePlayer();
    if (isPlaying) {
        if (audio) {
            audio.pause();
            audio = null;
        }
        togglePlayPause(true);
    }
}

// 播放下一首
function playNext() {
    current_song = (current_song + 1) % music_list.length;
    updatePlayer();
    if (isPlaying) {
        if (audio) {
            audio.pause();
            audio = null;
        }
        togglePlayPause(true);
    }
}

// 更新播放器显示
function updatePlayer() {
    const currentSong = music_list[current_song];

    // 更新封面
    document.querySelector('.cover img').src = currentSong.cover;

    // 更新歌曲信息
    document.querySelector('.song-name').textContent = currentSong.name;
    document.querySelector('.singer-name').textContent = currentSong.singer;
    document.querySelector('.total-time').textContent = currentSong.time;

    // 初始化进度条
    currentTimeDisplay.textContent = '00:00';
    progressBarLine.style.width = '0%';
    totalTimeDisplay.textContent = currentSong.time;

    // 更新列表激活状态
    document.querySelectorAll('.list-content li').forEach((item, index) => {
        item.classList.toggle('active', index === current_song);
    });
}

// 新增进度条更新函数
function updateProgress() {
    if (!audio) return;

    const progressPercent = (audio.currentTime / audio.duration) * 100;
    progressBarLine.style.width = `${progressPercent}%`;
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
}

// 时间格式化函数
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}



// 新增歌曲切换函数
function playSelectedSong(index) {
    // 如果点击的是当前歌曲且正在播放，不进行操作
    if (current_song === index && isPlaying) return;

    current_song = index;
    updatePlayer();

    if (isPlaying) {
        // 立即切换播放
        if (audio) {
            audio.pause();
            audio = null;
        }
        togglePlayPause(true);
    } else {
        // 仅更新显示不自动播放
        if (audio) audio.pause();
        audio = new Audio(music_list[current_song].audio_url);
        initAudioEvents();
    }
}

// 新增初始化音频事件函数
function initAudioEvents() {
    if (!audio) return;

    audio.addEventListener('loadedmetadata', () => {
        ``
        totalTimeDisplay.textContent = formatTime(audio.duration);
        progressBarLine.style.width = '0%';
        currentTimeDisplay.textContent = '00:00';
    });

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', playNext);
}