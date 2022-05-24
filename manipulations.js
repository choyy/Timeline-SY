// 将数据保存到挂件块的自定义属性
function saveData(dataobject) {
    var data_string = JSON.stringify(dataobject);
    var block_attrs = {
        "id": window.baseid,
        "attrs": {
            "custom-dataobject": data_string
        }
    };
    $.ajax({
        type: "POST",
        url: "/api/attr/setBlockAttrs",
        data: JSON.stringify(block_attrs),
        success(res) {
            console.log("save data success")
        }
    })
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
}

// 编辑框确认
function confirmYes() {
    // 若是在编辑状态且当前页为非标题页，需移除该页
    var id_to_remove = null;
    if (typeof (is_edit) != "undefined" && is_edit) {
        if (!timeline.getCurrentSlide()._text.options.title) {
            id_to_remove = timeline.current_id;
            // timeline.removeId(timeline.current_id);// 在此处移除会有bug：只有一页时不能先移除，编辑也会出问题
            // 要在添加页之后移除
            is_edit = false;
        } else {// 若为标题页
            var title_text = {
                "headline": "",
                "text": ""
            }
            title_text.headline = document.getElementById("slide_title").value;
            title_text.text = document.getElementById("slide_contents").value;
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
                        "end_date": {
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
            };
            dataobject.title = timeline.config.title;
            dataobject.events = timeline.config.events;
            dataobject.title.text = title_text;
            timeline = new TL.Timeline('Timeline', dataobject, options);
            saveData(dataobject);
            is_edit = false;
            // 关闭输入窗
            document.getElementById('light').style.display = 'none';
            document.getElementById('fade').style.display = 'none';
            clearIuputbox();
            return;
        }
    }
    // 添加时间或时期 
    var event_data = {
        "start_date": {
            "year": "",
            "month": "",
            "day": ""
        },
        "text": {
            "headline": "",
            "text": ""
        },
        "background": {
            "url": ""
        },
        "unique_id": ""
    };

    var event_end_date = {
        "year": "",
        "month": "",
        "day": ""
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

    event_end_date.year = document.getElementById("end_year").value;        //结束日期
    event_end_date.year = event_end_date.year.replace(/(^\s*)|(\s*$)/g, '');//去除空格
    if (!(event_end_date.year == null ||
        event_end_date.year == "" ||
        event_end_date.year == undefined)) {
        event_end_date.month = document.getElementById("end_month").value;
        event_end_date.day = document.getElementById("end_day").value;
        event_data["end_date"] = event_end_date;
    }
    if (document.getElementById("slide_title").value == "") {
        alert("标题不能为空");
        return;
    }
    event_data.text.headline = document.getElementById("slide_title").value;// 标题及描述
    event_data.text.text = document.getElementById("slide_contents").value;

    // 支持markdown语法链接
    event_data.text.headline = event_data.text.headline.replace(/\[([^\n\r]+)\]\(([^\n\r\(\)]+)\)/, "<a href='$2'>$1</a>");
    event_data.text.text = event_data.text.text.replace(/\[([^\n\r]+)\]\(([^\n\r\(\)]+)\)/, "<a href='$2'>$1</a>");



    var background_url = document.getElementById("slide_background").value;// 背景图片
    if (background_url.slice(0, 7) == "assets/") {
        background_url = "/" + background_url;
    }
    event_data.background.url = background_url;

    timeline.add(event_data); // 添加事件，此处参数event_date被改变了
    if (id_to_remove != null) {
        timeline.removeId(id_to_remove);// 编辑状态移除旧页
    }
    // 若超出时间轴范围，更新时间轴
    var timeaxis_range = timeline._timenav.timeaxis.minor_ticks;
    // -1 +1 是因为两端起始和末尾年份的minor ticks部分月份有、部分月份没有
    if (timeaxis_range.date == undefined) { //初始化时只有一个事件时间轴没有信息？
        timeline._timenav._drawTimeline();// 更新时间轴
    } else {
        var timeaxis_end = timeaxis_range[timeaxis_range.length - 1].date.data.date_obj.getFullYear() - 1;
        var timeaxis_begin = timeaxis_range[0].date.data.date_obj.getFullYear() + 1;
        // 此处event_date被改变了，所以访问year变了
        if (Number(event_data.start_date.data.year) < timeaxis_begin ||
            Number(event_data.start_date.data.year) > timeaxis_end ||
            (event_data["end_date"] != undefined && Number(event_data.end_date.data.year) > timeaxis_end)) {
            timeline._timenav._drawTimeline();// 更新时间轴
        }
    }

    timeline.goToId(event_data.unique_id);
    // 保存数据
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
                "end_date": {
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
    };
    dataobject.title = timeline.config.title;
    dataobject.events = timeline.config.events;
    saveData(dataobject);
    // 关闭输入窗
    document.getElementById('light').style.display = 'none';
    document.getElementById('fade').style.display = 'none';

    clearIuputbox();
}

// 编辑框取消
function confirmCancel() {
    document.getElementById('light').style.display = 'none';
    document.getElementById('fade').style.display = 'none';
    // 若为编辑状态清除输入框内容
    if (typeof (is_edit) != "undefined" && is_edit) {
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
            timeline.removeId(timeline.current_id);
        }
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
                    "end_date": {
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
        };
        dataobject.title = timeline.config.title;
        dataobject.events = timeline.config.events;
        saveData(dataobject);
    }
}

// 编辑页面
function editSlide() {
    // 获取该项数据，填入输入框
    is_edit = true;
    var slide_data = timeline.getCurrentSlide().data;
    if (!timeline.getCurrentSlide()._text.options.title) {// 若不是标题页，填入所有数据
        document.getElementById("start_year").value = slide_data.start_date.data.year;
        document.getElementById("start_month").value = slide_data.start_date.data.month;
        document.getElementById("start_day").value = slide_data.start_date.data.day;

        if (slide_data.end_date != null) { // 有end date就填入
            document.getElementById("end_year").value = slide_data.end_date.data.year;
            document.getElementById("end_month").value = slide_data.end_date.data.month;
            document.getElementById("end_day").value = slide_data.end_date.data.year;
        }
    }
    document.getElementById("slide_title").value = slide_data.text.headline;
    document.getElementById("slide_contents").value = slide_data.text.text;
    if (slide_data.background != null) { // 若background不为null填入url
        document.getElementById("slide_background").value = slide_data.background.url;
    }

}

function jumpToBlock() {
    // 获取正文中的超链接
    var tl_text = timeline.getCurrentSlide().data.text.text.replace(/.+(siyuan:\/\/blocks\/.+)/, "$1").slice(0,38);
    // 正则限制长度不起作用？
    // console.log(tl_text)

    var blockid = tl_text.replace(/^siyuan:\/\/blocks\/(.{22})$/, "$1");

    $.ajax({
        type: "POST",
        url: "/api/filetree/getHPathByID",
        data: JSON.stringify({
            "id": blockid
        }),
        success(res) {
            // console.log(res)
            if (res.code != 0) {
                // 验证块是否存在
                console.log("块不存在")
                return;
            } else { // 存在则跳转
                window.location.href = tl_text;
            }
        }
    })
}