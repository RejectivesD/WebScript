// ==UserScript==
// @name         b站自动刷新推荐（没什么用的小功能）
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  当你离开座位去干别的事情时，我会帮你自动刷新视频推荐，如果你在(当你鼠标在动时)，那么我就不会帮你刷新推荐
// @author       memoli
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.18.2/babel.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.16.0/polyfill.js
// @match        https://www.bilibili.com
// @icon         <$ICON$>
// ==/UserScript==

var inline_src = (<><![CDATA[

    // Your code here...
       const freshBtn=document.querySelector('.primary-btn.roll-btn')
    let isChange=false

    
    let mouseObj={
        m_x:0,
        m_y:0
    }
    
    let mouseBak={
        m_x:0,
        m_y:0
    }

    
    const delay=1000*30

    
    let timer_one=null

    
    const examine=()=>{
        //鼠标未移动
        if(mouseObj.m_x===mouseBak.m_x&&mouseObj.m_y===mouseBak.m_y){
            isChange=false            
        }else{
            isChange=true
        }

        if(!isChange){
            freshBtn.click()
        }else {
            return
        }
    }

    
    
    timer_one=setInterval(examine,delay)

    //用于同步两次鼠标坐标，因为不支持es6，吐了
    const synchronous=(obj,ValueName,newValue)=>{
        Object.defineProperty(obj,ValueName,{
            value:newValue,
            writable:true
        })
    }

    window.onmousemove=(evt)=>{
        //鼠标移动，先移除原有的定时器
        clearInterval(timer_one)
        Object.defineProperty(mouseObj,'m_x',{
            value:evt.pageX,
            writable:true
        })
        Object.defineProperty(mouseObj,'m_y',{
            value:evt.pageY,
            writable:true
        })    

        //防抖处理
        setTimeout(()=>{
            /**
             * 在进行同步之前，先清除前一个定时器，因为会一下子重置大量的定时器
             * 因为鼠标移动是一个连续的事件，避免一下子连续重置定时器，导致推荐视频被疯狂刷新
             * ---------简称防炸操作
             * 虽然也不能保证底层到底执行了什么，会不会影响实际性能
             * 但实测下来，即使鼠标连续型移动，1s后也不会出现疯狂刷新的现象
             **/
            clearInterval(timer_one)
            synchronous(mouseBak,'m_x',mouseObj.m_x)
            synchronous(mouseBak,'m_y',mouseObj.m_y)          
            isChange=true
            //记录完成后，重置定时器
            timer_one=setInterval(examine,delay)
        },1000)
    }

    



]]></>).toString();
var c = Babel.transform(inline_src, { presets: [ "es2015", "es2016" ] });
eval(c.code);