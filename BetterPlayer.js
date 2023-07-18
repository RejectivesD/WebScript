// ==UserScript==
// @name         BetterVideoPlayer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  网页视频自动播放和声音调节
// @author       MemoliPoi
// @match        *://www.bilibili.com/video/*
// @match        *://v.qq.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=jianshu.com
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  "use strict";
  //获取一当前页面的音频（包括视频的声音）
  let video = document.querySelector("video")
    ? document.querySelector("video")
    : null;
  //创建音频上下文
  const audioCtx = new AudioContext();
  //创建音频增益节点
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 1;
  let userCustomer = {
    protect: true, //护耳模式
    protectVolume: 0.15, //护耳模式下整体音量
    delayTime: 2, //延迟时间
    beQuiet:false,//强制静音
    quietVal:0.3,//音量增益
    AutoPlay: true,//自动播放
  };

  const customerKey = {
    protect_key: "protect_Req",
    protect_vol: "protect_vol",
    quiet_vol: "quiet_vol",
    auto_Play: "auto_Play",
  };

  /**
   * @description 脚本启动时确定初始化
   * @returns {{Protect:boolean,ProVol:Number,AutoPlay:boolean,BeQuiet:boolean}}
   */
  const UserCustomerInit = () => {
    let protect=GM_getValue(customerKey.protect_key, userCustomer.protect);
    let protectVolume=GM_getValue(customerKey.protect_vol, userCustomer.protectVolume);
    let autoPlay=GM_getValue(customerKey.protect_key, userCustomer.AutoPlay);
    let beQuiet = GM_getValue(customerKey.quiet_vol,userCustomer.beQuiet)
    return {
      Protect: protect,
      ProVol: protectVolume,
      AutoPlay: autoPlay,
      BeQuiet:beQuiet
    };
  };

  /**
   * @name 音频上下文初始化
   * @description 将当前页面的video标签的音频输出交给音频上下文
   */
  const AudioCtxInit = () => {
    if (video != null) {
      let source = audioCtx.createMediaElementSource(video);
      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);
    } else {
      console.warn("无法获取当前页面视频元素");
    }
  };

  /**
   * @description 延迟播放策略,默认启用
   * @param {Function} callback 播放策略
   * @param {Number} delay 延迟时间
   */
  const DelayPlay = (callback,delay) => {
    setTimeout(() => {
      callback && callback();
    }, delay * 1000);
  };

  /**
   * @description 音量逐步恢复
   * @param {Number} step 步进长度
   * @param {Number} delay 时间延迟
   */
  const DelayVolumeReset=(step,delay) => {
    let timer=setInterval(()=>{
      if(gainNode.gain.value+step<1){
        gainNode.gain.setValueAtTime(gainNode.gain.value+step,audioCtx.currentTime)
      }
    },1000)
    setTimeout(()=>{
      gainNode.gain.value=1
      clearInterval(timer)
      video.onloadstart=null
    },(delay*1500))
  }

  /**
   * @description 针对浏览器的自动播放设置
   * @param {Boolean} canPlay 视频是否能正常播放
   * @param {HTMLVideoElement} videoDom 视频标签
   */
  const PlayStrategy = (canPlay, videoDom) => {
    if (!canPlay) {
      //例如谷歌浏览器，采用视频静音策略进行播放
      videoDom.muted = true;
      videoDom.play();
      videoDom.muted = false;
    } else {
      videoDom.play();
    }
  };

  const AutoPlayVideo = () => {
    const customer = UserCustomerInit();
    AudioCtxInit();
    if (document.readyState === "complete" && video != null) {
      if(customer.AutoPlay){
        DelayPlay(PlayStrategy(video.played, video),2);
      }
      //护耳模式
      if (customer.Protect) {
        video.onplay=function(){
          gainNode.gain.value=customer.ProVol
          DelayVolumeReset(0.15,15)
        }
      }else if(customer.BeQuiet){
        //强制安静一点
        gainNode.gain.value=userCustomer.quietVal
      } else {
        gainNode.gain.value = 1;
      }
    }
  };
  document.onreadystatechange = AutoPlayVideo;

  const NeedProtect=GM_registerMenuCommand(`护耳模式${UserCustomerInit().Protect?"已开启":"已关闭"}`,(e)=>{
    const customer = UserCustomerInit()
    GM_setValue(customerKey.protect_key,customer.Protect?false:true)
    DelayVolumeReset(0.15,10)
    //启用护耳模式时，关闭强制安静
    GM_setValue(customerKey.quiet_vol,false)
  })

  const NeedQuiet=GM_registerMenuCommand(`安静模式：${UserCustomerInit().BeQuiet?"已开启":'已关闭'},  音量输出为${userCustomer.quietVal*100}%`,(e)=>{
    let con=confirm("开启安静模式后，将关闭护耳模式，刷新页面后生效")
    if(con){
       const customer = UserCustomerInit()
       GM_setValue(customerKey.quiet_vol,customer.BeQuiet?false:true)
       GM_setValue(customerKey.protect_key,false)
    }
  })

})();
