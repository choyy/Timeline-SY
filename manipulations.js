// 将数据保存到挂件块的自定义属性
function saveData(dataobject) {
    var data_string = JSON.stringify(dataobject);
    var block_attrs = {
        id: window.baseid,
        attrs: {
            "custom-dataobject": data_string,
        },
    };
    $.ajax({
        type: "POST",
        url: "/api/attr/setBlockAttrs",
        data: JSON.stringify(block_attrs),
        success(res) {
            console.log("save data success");
        },
    });
    modifyEditor();
}

// 设置分组
function setGroup() {
    let tl_events = timeline.config.events;
    let tl_group = new Set();
    let group_i = "";
    for (let i = 0; i < tl_events.length; i++) {
        group_i = tl_events[i].group;
        if (group_i != undefined && group_i != "") {
            tl_group.add(group_i);
        }
    }
    
    if (tl_group.size > 0) {
        let group_list = document.getElementById("group_list");
        for (const group_i of tl_group) {
            let group_item = document.createElement("option");
            group_item.value = group_i;
            group_list.appendChild(group_item);
        }
    }
}

// 清除输入框内容
function clearIuputbox() {
    // document.getElementById("start_year").value = "";
    // document.getElementById("start_month").value = "";
    // document.getElementById("start_day").value = "";
    document.getElementById("end_year").value = "";
    document.getElementById("end_month").value = "";
    document.getElementById("end_day").value = "";
    document.getElementById("slide_title").value = "";
    document.getElementById("slide_contents").value = "";
    document.getElementById("slide_background").value = "";
    document.getElementById("slide_blockid").value = "";
    document.getElementById("input_group").value = "";
    $(document.getElementById("group_list")).empty(); // 
}

// 编辑框确认
function confirmYes() {
    // 若是在编辑状态且当前页为非标题页，需移除该页
    var id_to_remove = null;
    if (typeof is_edit != "undefined" && is_edit) {
        if (!timeline.getCurrentSlide()._text.options.title) {
            id_to_remove = timeline.current_id;
            // timeline.removeId(timeline.current_id);// 在此处移除会有bug：只有一页时不能先移除，编辑也会出问题
            // 要在添加页之后移除
            is_edit = false;
        } else {
            // 若为标题页
            var title_text = {
                headline: "",
                text: "",
            };
            title_text.headline = document.getElementById("slide_title").value;
            title_text.text = document.getElementById("slide_contents").value;
            dataobject = {
                title: {},
                events: [],
                eras: [],
            };
            dataobject.title = timeline.config.title;
            dataobject.events = timeline.config.events;
            dataobject.eras = timeline.config.eras;
            dataobject.title.text = title_text;
            timeline = new TL.Timeline("Timeline", dataobject, options);
            timeline.on("loaded", function () {
                // 时间线加载完毕后设置鼠标事件、字体颜色
                setWheelEvent();
                setMarkerFontColor();
            });
            saveData(dataobject);
            is_edit = false;
            // 关闭输入窗
            document.getElementById("light").style.display = "none";
            document.getElementById("fade").style.display = "none";
            clearIuputbox();
            return;
        }
    }
    // 添加时间或时期
    var event_data = {
        start_date: {
            year: "",
            month: "",
            day: "",
        },
        text: {
            headline: "",
            text: "",
        },
        background: {
            url: "",
        },
        unique_id: "",
    };

    var event_end_date = {
        year: "",
        month: "",
        day: "",
    };
    var time_id = new Date();
    event_data.unique_id = time_id.getTime().toString();
    // 获取输入数据
    if (document.getElementById("start_year").value == "") {
        alert("起始日期不能为空");
        return;
    }
    event_data.start_date.year = document.getElementById("start_year").value; //开始日期
    event_data.start_date.month = document.getElementById("start_month").value;
    event_data.start_date.day = document.getElementById("start_day").value;
    event_data.start_date.hour = document.getElementById("start_hour").value;
    event_data.start_date.minute = document.getElementById("start_minute").value;
    event_data.start_date.second = document.getElementById("start_second").value;
    event_data["group"] = document.getElementById("input_group").value;

    event_end_date.year = document.getElementById("end_year").value; //结束日期
    event_end_date.year = event_end_date.year.replace(/(^\s*)|(\s*$)/g, ""); //去除空格
    if (
        !(
            event_end_date.year == null ||
            event_end_date.year == "" ||
            event_end_date.year == undefined
        )
    ) {
        event_end_date.month = document.getElementById("end_month").value;
        event_end_date.day = document.getElementById("end_day").value;
        event_data["end_date"] = event_end_date;
    }
    if (document.getElementById("slide_title").value == "") {
        alert("标题不能为空");
        return;
    }
    event_data.text.headline = document.getElementById("slide_title").value; // 标题及描述
    event_data.text.text = document.getElementById("slide_contents").value;

    // 支持markdown语法链接
    event_data.text.headline = event_data.text.headline.replace(
        /\[([^\n\r]+)\]\(([^\n\r\(\)]+)\)/,
        "<a href='$2'>$1</a>"
    );
    event_data.text.text = event_data.text.text.replace(
        /\[([^\n\r]+)\]\(([^\n\r\(\)]+)\)/,
        "<a href='$2'>$1</a>"
    );

    // 支持换行
    // event_data.text.text = event_data.text.text.replaceAll("\n", "<br>");
    event_data.text.text = event_data.text.text.replace(/\n/g, "<br>");

    var background_url = document.getElementById("slide_background").value; // 背景图片
    if (background_url.slice(0, 7) == "assets/") {
        background_url = "/" + background_url;
    }
    event_data.background.url = background_url;
    var blockid = document.getElementById("slide_blockid").value; // 思源块id
    if (blockid) {
        event_data.media = {};
        event_data.media.url = `<iframe src='/stage/build/mobile?id=${blockid}' data-id="${blockid}" ></iframe>`;
        event_data.media.blockid = blockid;
    }

    timeline.add(event_data); // 添加事件，此处参数event_date被改变了
    if (id_to_remove != null) {
        timeline.removeId(id_to_remove); // 编辑状态移除旧页
    }
    // 若超出时间轴范围，更新时间轴
    var timeaxis_range = timeline._timenav.timeaxis.minor_ticks;
    // -1 +1 是因为两端起始和末尾年份的minor ticks部分月份有、部分月份没有
    if (timeaxis_range.date == undefined) {
        //初始化时只有一个事件时间轴没有信息？
        timeline._timenav._drawTimeline(); // 更新时间轴
    } else {
        var timeaxis_end =
            timeaxis_range[
                timeaxis_range.length - 1
            ].date.data.date_obj.getFullYear() - 1;
        var timeaxis_begin = timeaxis_range[0].date.data.date_obj.getFullYear() + 1;
        // 此处event_date被改变了，所以访问year变了
        if (
            Number(event_data.start_date.data.year) < timeaxis_begin ||
            Number(event_data.start_date.data.year) > timeaxis_end ||
            (event_data["end_date"] != undefined &&
                Number(event_data.end_date.data.year) > timeaxis_end)
        ) {
            timeline._timenav._drawTimeline(); // 更新时间轴
        }
    }

    timeline.goToId(event_data.unique_id);
    if (document.getElementById("slide_title").value.substring(0, 1) == "#") { // 添加颜色
        let font_color_name = document.getElementById("slide_title").value.substring(1, 2);
        let font_color = getColor(font_color_name);
        
        if (font_color != false) {
            let current_maker = document.getElementsByClassName("tl-timemarker tl-timemarker-active");
            current_maker[0].children[1].children[0].children[0].children[0].style.color = font_color;
        }
    }


    // 保存数据
    dataobject = {
        title: {},
        events: [],
        eras: [],
    };
    dataobject.title = timeline.config.title;
    dataobject.events = timeline.config.events;
    dataobject.eras = timeline.config.eras;
    saveData(dataobject);
    // 关闭输入窗
    document.getElementById("light").style.display = "none";
    document.getElementById("fade").style.display = "none";

    clearIuputbox();
}

// 编辑框取消
function confirmCancel() {
    document.getElementById("light").style.display = "none";
    document.getElementById("fade").style.display = "none";
    // 若为编辑状态清除输入框内容
    if (typeof is_edit != "undefined" && is_edit) {
        clearIuputbox();
        is_edit = false;
    }
}

// 删除页面
function deleteSlide() {
    if (timeline.getCurrentSlide()._text.options.title) {
        alert("标题页无法删除");
        return;
    } else {
        var delete_confirm = confirm("确定删除该项吗？");
        if (delete_confirm) {
            // 获得幻灯片序号，删除后跳到下一个幻灯片
            let slide_index = timeline._getSlideIndex(timeline.current_id);
            if (slide_index >= timeline.config.events.length) {
                slide_index -= 1;
            }
            timeline.removeId(timeline.current_id);
            timeline.goTo(slide_index);
        }
        dataobject = {
            title: {},
            events: [],
            eras: [],
        };
        dataobject.title = timeline.config.title;
        dataobject.events = timeline.config.events;
        dataobject.eras = timeline.config.eras;
        saveData(dataobject);
    }
}

// 新建项目
function addSlide() {
    setGroup();
    document.getElementById('light').style.display = 'block';
    document.getElementById('fade').style.display = 'block';
}

// 编辑项目
function editSlide() {
    // 获取该项数据，填入输入框
    is_edit = true;
    var slide_data = timeline.getCurrentSlide().data;
    if (!timeline.getCurrentSlide()._text.options.title) {
        // 若不是标题页，填入所有数据
        document.getElementById("start_year").value = slide_data.start_date.data.year;
        document.getElementById("start_month").value = slide_data.start_date.data.month;
        document.getElementById("start_day").value = slide_data.start_date.data.day;
        if (slide_data.end_date.data.hour != undefined) {
            document.getElementById("end_hour").value = slide_data.end_date.data.hour;
            document.getElementById("end_minute").value = slide_data.end_date.data.minute;
            document.getElementById("end_second").value = slide_data.end_date.data.second;
        }

        if (slide_data.end_date != null) {
            // 有end date就填入
            document.getElementById("end_year").value = slide_data.end_date.data.year;
            document.getElementById("end_month").value = slide_data.end_date.data.month;
            document.getElementById("end_day").value = slide_data.end_date.data.day;
            if (slide_data.end_date.data.hour != undefined) {
                document.getElementById("end_hour").value = slide_data.end_date.data.hour;
                document.getElementById("end_minute").value = slide_data.end_date.data.minute;
                document.getElementById("end_second").value = slide_data.end_date.data.second;
            }
        }
        if(slide_data.group != null){
            // 有 group 就填入
            document.getElementById("input_group").value = slide_data.group;
        }
    }
    document.getElementById("slide_title").value = slide_data.text.headline;
    document.getElementById("slide_contents").value = slide_data.text.text;

    // html <a></a>链接转换为markdown语法链接
    document.getElementById("slide_title").value = document.getElementById("slide_title").value.replace(/<a.*? href="([^\n\r]+?)".*?>(.+)<\/a>/, "[$2]($1)");
    document.getElementById("slide_contents").value = document.getElementById("slide_contents").value.replace(/<a.*? href="([^\n\r]+?)".*?>(.+)<\/a>/, "[$2]($1)");

    // html 换行<br>转换为\n
    // document.getElementById("slide_contents").value = document.getElementById("slide_contents").value.replaceAll("<br>", "\n");
    document.getElementById("slide_contents").value = document.getElementById("slide_contents").value.replace(/<br>/g, "\n");

    if (slide_data.background != null) {
        // 若background不为null填入url
        document.getElementById("slide_background").value =
            slide_data.background.url;
    }
    if (slide_data.media != null) {
        // 若background不为null填入url
        document.getElementById("slide_blockid").value = slide_data.media.blockid;
    }
    setGroup();
    document.getElementById('light').style.display = 'block';
    document.getElementById('fade').style.display = 'block';
}

function timelineReload() {
    createTlFromData();
    setTimeout(setWheelEvent, 1000)
}

// 添加纪元项
function eraInputAdd(era_obj) {
    let vote = document.getElementById("vote");
    let position_sign = document.getElementById("position-sign");
    let input = document.createElement("input");
    let tl_block = document.createElement("div")
    let year1 = document.createTextNode(" 年 ～ ");
    let year2 = document.createTextNode(" 年： ");
    let title = document.createElement("input");
    let era_item = document.createElement("div");
    let del_button = document.createElement("input");

    era_item.id = "era-item";

    input.type = "number";
    input.className = "tl-year-field";
    input.name = "era_start_date";

    title.type = "text";
    title.className = "tl-era-title-field";
    title.name = "era_title";
    title.placeholder = "纪元名称";

    // 删除纪元项的按钮
    del_button.type = "button";
    del_button.value = "—";
    del_button.className = "tl-red-button";
    del_button.style = "margin-left:3px;"
    del_button.onclick = function () {
        this.parentNode.remove(this.parentNode)
    };

    tl_block.className = "tl-block";

    era_item.appendChild(input);
    era_item.appendChild(year1);

    input = input.cloneNode(false);
    input.name = "era_end_date";
    era_item.appendChild(input);
    era_item.appendChild(year2);
    era_item.appendChild(title);
    if (era_obj != null) {
        // era_obj 为填入输入框的内容
        era_item.children[0].value = era_obj.start_date.data.year;
        era_item.children[1].value = era_obj.end_date.data.year;
        era_item.children[2].value = era_obj.headline;
    }
    era_item.appendChild(del_button);
    era_item.appendChild(tl_block);
    vote.insertBefore(era_item, position_sign);
}

function eraPanelShow() {
    var vote = document.getElementById("vote");
    // 删除子节点
    var v_len = vote.children.length;
    for (let i = 0; i < v_len - 1; i++) {
        vote.removeChild(vote.children[0]);
    }

    // 添加已有纪元节点
    var tl_eras = timeline.config.eras;
    for (let i = 0; i < tl_eras.length; i++) {
        eraInputAdd(tl_eras[i]);
    }

    document.getElementById('tl_era_panel').style.display = 'block';
    document.getElementById('fade').style.display = 'block';
}

function eraConfirmYes() {
    // 输入框内容
    var era_start_date = document.getElementsByName("era_start_date");
    var era_end_date = document.getElementsByName("era_end_date");
    var era_title = document.getElementsByName("era_title")
    var era_list = [];
    for (let i = 0; i < era_title.length; i++) {
        var era_obj = {
            start_date: {
                year: "",
            },
            end_date: {
                year: "",
            },
            text: {
                headline: ""
            },
        };
        if (era_start_date[i].value == "" || era_end_date[i].value == "" || era_title[i].value == "") {
            alert("不可有日期或名称为空！")
            return;
        }
        era_obj.start_date.year = era_start_date[i].value;
        era_obj.end_date.year = era_end_date[i].value;
        era_obj.text.headline = era_title[i].value;
        era_list.push(era_obj);
    }
    dataobject["eras"] = era_list;
    saveData(dataobject);
    timeline = new TL.Timeline("Timeline", dataobject, options);
    timeline.on("loaded", function () {
        // 时间线加载完毕后设置鼠标事件、字体颜色
        setMarkerFontColor();
        setWheelEvent();
    });
    document.getElementById("tl_era_panel").style.display = "none";
    document.getElementById("fade").style.display = "none";
}

function eraConfirmCancel() {
    document.getElementById("tl_era_panel").style.display = "none";
    document.getElementById("fade").style.display = "none";
}

// 时间线设置
function timelineSettingsShow() {
    $.ajax({
        type: "POST",
        url: "/api/attr/getBlockAttrs",
        data: JSON.stringify({
            "id": id
        }),
        success(res) {
            if (res.data["custom-dataoptions"] != undefined) {
                //读取数据
                // let dataoptions_str = res.data["custom-dataoptions"].replaceAll("&quot;", "\"");
                let dataoptions_str = res.data["custom-dataoptions"].replace(/&quot;/g, "\"");
                let data_options = JSON.parse(dataoptions_str);
                document.getElementById('timenav_height_percentage').value = data_options.timenav_height_percentage;
                if (data_options.start_at_end == true) {
                    document.getElementById('start_location').value = 1
                }
                if (data_options.timenav_position == "bottom") {
                    document.getElementById('timenav_position').value = 1
                }
            } else {
                document.getElementById('timenav_height_percentage').value = 25;
            }
        }
    })

    document.getElementById('tl_settings_panel').style.display = 'block';
    document.getElementById('fade').style.display = 'block';
}

function tlsettingsConfirmYes() {
    let tl_height_percent = document.getElementById('timenav_height_percentage').value;
    options['timenav_height_percentage'] = tl_height_percent;
    if (document.getElementById('start_location').value == 1) {
        options.start_at_end = true;
    }
    if (document.getElementById('timenav_position').value == 1) {
        options.timenav_position = 'bottom';
    }else{
        options.timenav_position = 'top';
    }
    
    // 保存options数据
    let data_options = {
        timenav_height_percentage: tl_height_percent,
        start_at_end: options.start_at_end,
        timenav_position: options.timenav_position,
    };
    let data_options_string = JSON.stringify(data_options);
    let block_attrs = {
        id: window.baseid,
        attrs: {
            "custom-dataoptions": data_options_string,
        },
    };
    $.ajax({
        type: "POST",
        url: "/api/attr/setBlockAttrs",
        data: JSON.stringify(block_attrs),
        success(res) {
            console.log("save data options success");
        },
    });

    timeline = new TL.Timeline("Timeline", dataobject, options);
    timeline.on("loaded", function () {
        // 时间线加载完毕后设置鼠标事件、文字颜色、按钮位置
        setWheelEvent();
        setMarkerFontColor();
        setTimeout(setButtonPosition, 1000)
    });

    document.getElementById("tl_settings_panel").style.display = "none";
    document.getElementById("fade").style.display = "none";
}

function tlsettingsConfirmCancel() {
    document.getElementById("tl_settings_panel").style.display = "none";
    document.getElementById("fade").style.display = "none";
}

// 设置marker字体颜色
function getColor(color_name) {
    switch (color_name) {
        case "r":
        case "R":
            return 'red';
        case "g":
        case "G":
            if (window.top.siyuan && window.top.siyuan.config.appearance.mode == 1) { // 暗色
                return '#00ff00';
            }
            return 'green';
        case "b":
        case "B":
            if (window.top.siyuan && window.top.siyuan.config.appearance.mode == 1) { // 暗色
                return '#609aff';
            }
            return 'blue';
        case "y":
        case "Y":
            if (window.top.siyuan && window.top.siyuan.config.appearance.mode == 1) { // 暗色
                return 'yellow';
            }
                return '#b6a207';
        case "o":
        case "O":
            return '#e19200';
        case "p":
        case "P":
            if (window.top.siyuan && window.top.siyuan.config.appearance.mode == 1) { // 暗色
                return '#d104ff';
            }
            return 'purple';

        default:
            return false;
    }
}
function setMarkerFontColor() {
    let tl_marker_font = document.getElementsByClassName("tl-headline tl-headline-fadeout");
    let marker_text = "";
    for (let i = 0; i < tl_marker_font.length; i++) {
        marker_text = tl_marker_font[i].innerText;
        if (marker_text.substring(0, 1) == "#") {
            let font_color_name = marker_text.substring(1, 2);
            let font_color = getColor(font_color_name);
            if (font_color != false) {
                tl_marker_font[i].style.color = font_color;
            }
        }
    }
}

// 分组重命名
function groupRename() {
    $(document.getElementById("group_select")).empty(); // 清空内容
    document.getElementById("group_renamed").value = null;
    let tl_events = timeline.config.events;
    let tl_group = new Set();
    let group_i = "";
    for (let i = 0; i < tl_events.length; i++) {
        group_i = tl_events[i].group;
        if (group_i != undefined && group_i != "") {
            tl_group.add(group_i);
        }
    }
    
    if (tl_group.size > 0) {
        let group_select = document.getElementById("group_select");
        for (const group_i of tl_group) {
            let group_item = document.createElement("option");
            group_item.innerText = group_i;
            group_select.appendChild(group_item);
        }
    }

    document.getElementById('tl_group_rename_panel').style.display = 'block';
    document.getElementById('fade').style.display = 'block';
}
function groupConfirmYes() {
    for (let i = 0; i < dataobject.events.length; i++) {
        let group_to_rename = document.getElementById("group_select").value;
        let group_renamed = document.getElementById("group_renamed").value;
        if(dataobject.events[i].group == group_to_rename){
            dataobject.events[i].group = group_renamed;
        }
    }
    saveData(dataobject);
    timeline = new TL.Timeline("Timeline", dataobject, options);
    timeline.on("loaded", function () {
        // 时间线加载完毕后设置鼠标事件、字体颜色
        setMarkerFontColor();
        setWheelEvent();
    });
    document.getElementById('tl_group_rename_panel').style.display = "none";
    document.getElementById('fade').style.display = "none";
}
function groupConfirmCancel() {
    document.getElementById('tl_group_rename_panel').style.display = "none";
    document.getElementById('fade').style.display = "none";
}

// 切换全屏
function setFullscreen() {
    const widget_element = document.body;
    if (document.fullscreenElement == null) {
        widget_element.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}
    

function modifyEditor() {
    let iframes = document.querySelectorAll("iframe[data-id]");
    // console.log(iframes);

    if (iframes[0]) {
        iframes.forEach((syIframe) => {
            let ClientRect = syIframe.getBoundingClientRect();
            console.log(ClientRect);
            if (
                ClientRect.left > window.scrollX &&
                ClientRect.right < window.scrollX + window.innerWidth
            )
                editorgoto(syIframe);
        });
    }
}
function editorgoto(syIframe) {
    let editorDOM = syIframe.contentDocument;
    let editorWindow = syIframe.contentWindow;
    console.log(editorDOM);
    //console.log(editorWindow.siyuan);
    if (!editorWindow.siyuan) {
        setTimeout(() => editorgoto(syIframe), 100);
        return null;
    }
    if (!editorDOM) {
        setTimeout(() => editorgoto(syIframe), 100);
        return null;
    }
    if (!editorWindow.siyuan.mobileEditor) {
        setTimeout(() => editorgoto(syIframe), 100);
        return null;
    }
    if (!editorDOM) {
        setTimeout(() => editorgoto(syIframe), 100);
        return null;
    }
    clearTimeout(editorgoto);
    window.iframes
        ? (window.iframes[syIframe.getAttribute("data-id")] = syIframe)
        : () => {
            window.iframes = {};
            window.iframes[syIframe.getAttribute("data-id")] = syIframe;
        };
    let id = syIframe.getAttribute("data-id");

    gotoBlockID(syIframe.getAttribute("data-id"), editorDOM);
}
function gotoBlockID(id, editorDOM) {
    console.log("测试", editorDOM);
    if (!editorDOM) {
        setTimeout(() => editorgoto(editorDOM.window), 100);
        return null;
    }
    let target = editorDOM.querySelector(
        ".protyle-breadcrumb>.protyle-breadcrumb__bar"
    );
    let target1 = editorDOM.querySelector(
        ".protyle-wysiwyg div[data-node-id] div[contenteditable]"
    );
    //  console.log(target, target1);
    if (target && target1) {
        let link = editorDOM.createElement("span");
        link.setAttribute("class", "protyle-breadcrumb__item");
        link.setAttribute("data-node-id", id);
        let event = editorDOM.createEvent("MouseEvents");
        event.initMouseEvent(
            "click",
            true,
            false,
            window,
            0,
            0,
            0,
            0,
            0,
            false,
            false,
            false,
            false,
            0,
            null
        );
        target.appendChild(link);
        //link.click;
        link.dispatchEvent(event);
        link.remove();
    } else {
        let editor = editorDOM.querySelector("#editor");
        if (editor && editor.innerText == "不存在符合条件的内容块") {
            return;
        } else {
            setTimeout(async () => gotoBlockID(id, editorDOM), 100);
        }
    }
}
window.addEventListener("mouseup", modifyEditor);
