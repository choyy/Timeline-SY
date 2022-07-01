var options = {
    width: '100%',
    height: '100%',
    timenav_position: 'top',
    language: 'timeline3/js/locale/zh-cn.json',
    font: 'font.default.modified.css',
    default_bg_color: 'white',
    start_at_end: false,
    start_at_slide: 0,
    initial_zoom: 0
};

// 随思源主题自动切换主题
// https://ld246.com/article/1653294035002/comment/1653327149164?r=bgt#comments
if (window.top.siyuan && window.top.siyuan.config.appearance.mode === 1) {
    var obj = document.getElementById("timelinetheme");
    obj.setAttribute("href", "timeline3/css/themes/timeline.theme.dark.css");
    options.default_bg_color = "#000000";
}

var id = ''

if (window.frameElement) {
    id = window.frameElement.parentElement.parentElement.dataset.nodeId;
} else {
    const search = location.search
    const obj = new URLSearchParams(search);
    id = obj.get('blockid')
}
window.baseid = id
var dataobject = {
    "title": {
        "text": {
            "headline": "时间线",
            "text": ""
        }
    },
    "events": [
        {
            "start_date": {
                "year": "",
                "month": "",
                "day": ""
            },
            "text": {
                "headline": "创建了时间线",
                "text": ""
            },
            "unique_id": "create_timeline"
        }
    ],
}

function createTlFromData() {
    $.ajax({
        type: "POST",
        url: "/api/attr/getBlockAttrs",
        data: JSON.stringify({
            "id": id
        }),
        success(res) {
            if (res.data["custom-dataobject"] == undefined) {
                var init_date = new Date();
                dataobject.events[0].start_date.year = init_date.getFullYear();
                dataobject.events[0].start_date.month = init_date.getMonth() + 1;
                dataobject.events[0].start_date.day = init_date.getDate();
            } else {
                //若有已保存的数据，读取数据
                var dataobj = res.data["custom-dataobject"].replaceAll("&quot;", "\"");
                dataobj = dataobj.replaceAll("&lt;", "\<");
                dataobj = dataobj.replaceAll("&gt;", "\>");
                dataobject = JSON.parse(dataobj);

                var dataevents = dataobject.events;
                var dataeras = dataobject.eras;
                if (dataeras != undefined && dataeras[0] != undefined && dataeras[0].start_date.data != undefined) {
                    var tmp;
                    for (var i = 0, len = dataeras.length; i < len; i++) {
                        tmp = dataeras[i].start_date.data;
                        delete dataeras[i].start_date.data;
                        dataeras[i].start_date = tmp;

                        tmp = dataeras[i].end_date.data;
                        delete dataeras[i].end_date.data;
                        dataeras[i].end_date = tmp;

                        tmp = { headline: dataeras[i].headline };
                        dataeras[i]["text"] = tmp;
                    }
                    dataobject.eras = dataeras;
                }
                if (dataevents[0].start_date.data != undefined) {
                    var tmp;
                    for (var i = 0, len = dataevents.length; i < len; i++) {
                        tmp = dataevents[i].start_date.data;
                        delete dataevents[i].start_date.data;
                        // delete tmp.date_obj;    // 删不删没区别
                        // delete tmp.format;
                        // delete tmp.format_short;
                        dataevents[i].start_date = tmp;

                        if (dataevents[i].end_date != undefined) {
                            tmp = dataevents[i].end_date.data;
                            delete dataevents[i].end_date.data;
                            dataevents[i].end_date = tmp;
                        }
                    }
                    dataobject.events = dataevents;
                }
            }
            timeline = new TL.Timeline('Timeline', dataobject, options);
        }
    })
}
createTlFromData();

// 鼠标滚轮切换幻灯片
function setWheelEvent() {
    if (document.getElementsByClassName("tl-timenav-slider-background")[0] != undefined) {
        var box = document.getElementsByClassName("tl-timenav-slider-background")[0]
        function onMouseWheel(ev) {
            var ev = ev || window.event;
            var down = true;
            down = ev.wheelDelta ? ev.wheelDelta < 0 : ev.detail > 0;
            var slide_index = timeline._getSlideIndex(timeline.current_id);
            var slide_num = timeline._timenav._markers.length;
            if (down) {
                if (slide_index != slide_num) {
                    timeline.goToNext();
                } else {
                    console.log("已到达最后一页");
                }
            } else {
                if (slide_index != 0) {
                    timeline.goToPrev();
                } else {
                    console.log("已到达第一页");
                }
            }
            if (ev.preventDefault) {
                // 阻止默认事件
                ev.preventDefault();
            }
            return false;
        }
        addEvent(box, 'mousewheel', onMouseWheel);
        addEvent(box, 'DOMMouseScroll', onMouseWheel);
        function addEvent(obj, xEvent, fn) {
            if (obj.attachEvent) {
                obj.attachEvent('on' + xEvent, fn);
            } else {
                obj.addEventListener(xEvent, fn, false);
            }
        }
    }
}
setTimeout(setWheelEvent, 1000)