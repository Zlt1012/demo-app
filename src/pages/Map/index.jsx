import React, { useEffect, useState, useRef } from "react";
import { Input, Table, Tabs, Tag, Card } from "antd";
import featureData from "./world.zh.json";
import { Scatter } from "@antv/g2plot";
import dayjs from "dayjs";
import lemonIcon from "../../assets/icon/icon-lemon.svg";
import { columns } from "./config";
import { tableData, chartData2 } from "./mockData";
import "./style.css";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";

const ENUM_COLOR = [
  "red",
  "pink",
  "blue",
  "purple",
  "cyan",
  "yellow",
  "darkblue",
  "fuchsia",
  "hotpink",
  "darkgreen",
  "lightgreen",
  "navy",
  "gold",
];

// 是不是手机
const isMobileDevice =
  /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

const Page = () => {
  const mapRef = useRef(null);
  const scatterPlotRef = useRef(null);
  const fillLayerRef = useRef(null);

  const [dataSource, setDataSource] = useState(tableData);
  const [chartData, setChartData] = useState(chartData2);
  const [isDrawerOpens, setIsDrawerOpens] = useState([false, false]);
  const [selectedProjTags, setSelectedProjTags] = useState([]);
  const [selectedCustTags, setSelectedCustTags] = useState([]);
  const [selectedRangeTags, setSelectedRangeTags] = useState([]);
  const [selectedStatusTags, setSelectedStatusTags] = useState([]);
  const [selectedOnlyOneTags, setSelectedOnlyOneTags] = useState([]);
  const [selectedEndDateTags, setSelectedEndDateTags] = useState([]);
  const [mousemSelectedData, setMousemSelectedData] = useState("");
  const [markedArea, setMarkedArea] = useState([]);
  const [projectsData, setProjectsData] = useState([]);
  const [customnersData, setCustomnersData] = useState([]);
  const [publishData, setPublishData] = useState([]);
  const [onlyOneData, setOnlyOneData] = useState([]); // 是否独家签约
  const [endDateData, setEndDateData] = useState(["近半年", "近一年"]); // 签约到期时间
  const [statusData, setStatusData] = useState([]); // 项目状态

  const feishuDataRef = useRef([]);
  const [currentFeishuData, setCurrentFeishuData] = useState([]);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    const area =
      currentFeishuData?.map?.((v) => v?.fields?.["授权区域"])?.flat() || [];
    console.log(area);
    const areaSet = new Set();
    area.forEach((item) => {
      areaSet.add(item);
    });
    renderMap([...areaSet]);
  }, [currentFeishuData]);

  const init = async () => {
    renderChart();
    initMap();
    fetchFeishuAppData();
  };

  const fetchFeishuAppData = async () => {
    const responseAccessToken = await fetch(
      "/open-apis/auth/v3/app_access_token/internal",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_secret: "D8ghPMwm5gnsxJVVqXo6hgEdpXIEcpls",
          app_id: "cli_a6258e69ff70900c",
        }),
      }
    );
    if (!responseAccessToken.ok) {
      throw new Error(`HTTP error! status: ${responseAccessToken.status}`);
    }

    // 将响应体解析为 JSON
    const accessToken = await responseAccessToken.json();
    console.log(accessToken);

    const appId = "SRNFbD1xSasuOEsxeJFcR0dWn1d";
    const responseTable = await fetch(
      `/open-apis/bitable/v1/apps/${appId}/tables`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken.app_access_token,
        },
      }
    );

    // 将响应体解析为 JSON
    const tablesFeishu = await responseTable.json();
    console.log(tablesFeishu);
    const tableInfo = tablesFeishu.data.items.find(
      (table) => table.name === "合同信息"
    );
    const tableId = tableInfo.table_id;

    const recordsUrl = `/open-apis/bitable/v1/apps/${appId}/tables/${tableId}/records`;
    const responseRecords = await fetch(recordsUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken.app_access_token,
      },
    });

    // 将响应体解析为 JSON
    const recordsFeishu = await responseRecords.json();
    console.log(recordsFeishu);
    feishuDataRef.current = recordsFeishu.data.items;

    const authorityAreasSet = new Set();
    const projectsSet = new Set();
    const customersSet = new Set();
    const publishSet = new Set();
    const statusSet = new Set();
    const onlyOneSet = new Set();
    recordsFeishu.data.items.forEach((record) => {
      const authorityArea = record.fields?.["授权区域"];
      if (authorityArea) {
        authorityArea.forEach((area) => {
          authorityAreasSet.add(area);
        });
      }

      const projects = record.fields?.["签约项目"];
      projects && projectsSet.add(projects);

      const customers = record.fields?.["对方签约公司"];
      if (customers) {
        customers.forEach((item) => {
          customersSet.add(item);
        });
      }

      const publish = record.fields?.["发行范围"];
      if (publish) {
        publish.forEach((item) => {
          publishSet.add(item);
        });
      }
      const status = record.fields?.["项目状态"];
      status && statusSet.add(status);

      const onlyOne = record.fields?.["是否独家签约"];
      onlyOne && onlyOneSet.add(onlyOne);
    });
    console.log("authorityAreasSet-----", authorityAreasSet);

    setMarkedArea([...authorityAreasSet]);
    setProjectsData([...projectsSet]);
    setCustomnersData([...customersSet]);
    setPublishData([...publishSet]);
    setStatusData([...statusSet]);
    setOnlyOneData([...onlyOneSet]);

    console.log("projectsSetprojectsSet", projectsSet);
    // 默认显示全部项目的区域
    handlefeishuData();
    return [authorityAreasSet, projectsSet, customersSet];
  };

  const initMap = async () => {
    mapRef.current = new window.BMapGL.Map("allmap");
    let point = new window.BMapGL.Point(116.414, 39.915);
    mapRef.current.centerAndZoom(point, 1);
    mapRef.current.enableScrollWheelZoom(true);
    mapRef.current.setMapStyleV2({ styleJson: window.whiteStyle });
  };

  // 获取国家的颜色
  const getFillColor = (markedArea) => {
    return markedArea
      .filter((v) => !!v)
      .map((value, index) => [value, ENUM_COLOR[index % ENUM_COLOR.length]])
      .flat();
  };

  const renderMap = async (markedArea) => {
    const fillColor = getFillColor(markedArea);
    mapRef.current.removeNormalLayer(fillLayerRef.current);
    fillLayerRef.current = new window.BMapGL.FillLayer({
      crs: "GCJ02",
      enablePicked: true,
      autoSelect: true,
      pickWidth: 30,
      pickHeight: 30,
      selectedColor: "orange", // 悬浮选中项颜色
      border: true,
      style: {
        fillColor: [
          "case",
          ["boolean", ["feature-state", "picked"], false],
          "red",
          [
            "match",
            ["get", "name"],
            ...fillColor,
            "中国",
            "red",
            "green", // 明确指定默认值为空
          ],
        ],
        fillOpacity: 0.3,
        strokeWeight: 1,
        strokeColor: "white",
      },
    });
    const messageDom = document.getElementById("message");
    fillLayerRef.current.addEventListener(
      // isMobileDevice ? "click" : "mousemove",
      "click",
      (e) => {
        const name = e?.value?.dataItem?.properties?.name;
        if (name) {
          // messageDom.style.display = "block";
          // messageDom.style.left = e.pixel.x + 6 + "px";

          messageDom.style.left = "";
          messageDom.style.top = "";

          messageDom.style.display = "block";
          messageDom.style.height = "245px";
          messageDom.style.width = isMobileDevice ? "70%" : '400px';
          messageDom.style.overflowY = "auto";
          messageDom.style.bottom = "8px";
          messageDom.style.right = "8px";
          // messageDom.style.cursor = "move";

          // messageDom.style.whiteSpace = "nowrap";
          // messageDom.style.overflow = "hidden";
          // messageDom.style.textOverflow = "ellipsis";

          // 拖动  ----------------------------
          messageDom.onmousedown = (event) => {
            event.preventDefault();
            let shiftX =
              event.clientX - messageDom.getBoundingClientRect().left;
            let shiftY = event.clientY - messageDom.getBoundingClientRect().top;
            const moveAt = (pageX, pageY) => {
              messageDom.style.left = pageX - shiftX + "px";
              messageDom.style.top = pageY - shiftY + "px";
            };
            const onMouseMove = (event) => {
              moveAt(event.pageX, event.pageY);
            };
            document.addEventListener("mousemove", onMouseMove);

            document.onmouseup = () => {
              document.removeEventListener("mousemove", onMouseMove);
              document.onmouseup = null;
            };
          };
          messageDom.ondragstart = () => false;
          // -------------------------------- end

          // // 剩余的高度
          // const restHeight = window.innerHeight - e.pixel.y;
          // const messageDomHeigh = 364;
          // // 剩余的高度 > messageDom高度 就向上移动
          // if (restHeight > messageDomHeigh) {
          //   messageDom.style.top = e.pixel.y + "px";
          // } else {
          //   messageDom.style.top =
          //     e.pixel.y + restHeight - messageDomHeigh + "px";
          // }

          // 获取数据
          const list = currentFeishuData.filter((v) =>
            v?.fields?.["授权区域"]?.includes(name)
          );
          setMousemSelectedData(
            <Tabs
              defaultActiveKey="1"
              items={list.map((data, i) => ({
                key: i,
                label: data?.fields?.["签约项目"],
                children: (
                  <div className="mouse_message">
                    <p>客户名称：{data?.fields?.["对方签约公司"]}</p>
                    <p>
                      签约日期：
                      {data?.fields?.["合同签约时间"] &&
                        new Date(
                          data?.fields?.["合同签约时间"]
                        ).toLocaleDateString()}
                      &nbsp;&nbsp; 到期日期：
                      {data?.fields?.["到期时间"] &&
                        new Date(
                          data?.fields?.["到期时间"]
                        ).toLocaleDateString()}
                    </p>
                    <p>发行范围：{data?.fields?.["发行范围"]?.toString()}</p>
                    <p>
                      {data?.fields?.["是否独家签约"]}
                      &nbsp;&nbsp; 单集价格：$
                      {data?.fields?.["美元单集价格"]?.toLocaleString()}
                    </p>
                  </div>
                ),
              }))}
            />
          );

          // this.updateState(e.value.dataIndex, { picked: true }, true);
        } else {
          if (messageDom?.style?.display) {
            messageDom.style.display = "none";
          }
        }
      }
    );

    mapRef.current.addNormalLayer(fillLayerRef.current);
    const _featureData = JSON.parse(JSON.stringify(featureData));
    _featureData.features = _featureData.features.filter((feature) =>
      markedArea.includes(feature.properties.name)
    );
    fillLayerRef.current.setData(_featureData);
  };

  const renderChart = () => {
    if (!scatterPlotRef.current) {
      scatterPlotRef.current = new Scatter("chartContainer", {
        // padding: 40,
        data: chartData,
        xField: "year",
        yField: "month",
        size: 8,
        shape: "circle",
        pointStyle: {
          fill: "orange",
        },
        tooltip: false,
        // tooltip: {
        //   customContent: (title, data) => {
        //     return data?.[0]?.data?.name;
        //   },
        // },
        yAxis: {
          max: 13,
          label: false,
        },
        xAxis: {
          min: 2019,
          max: 2025,
          grid: {
            line: {
              style: {
                stroke: "#eee",
              },
            },
          },
          line: {
            style: {
              stroke: "#aaa",
            },
          },
        },
        label: {
          formatter: (data) => {
            return data?.name;
          },
          //    style: {
          //   fill: 'red',
          //   opacity: 0.6,
          //   fontSize: 24
          // }
        },
      });
      scatterPlotRef.current.render();
    }
  };
  // 判断是否半年、一年
  const verifyTime = (selectedData, timestamp) => {
    const date = dayjs(timestamp);
    const now = dayjs();
    const sixMonthsAgo = now.subtract(6, "month");
    const oneYearAgo = now.subtract(1, "year");
    return selectedData.some((v) => {
      let isPass = false;
      if (v === "近半年") {
        isPass = date.isAfter(sixMonthsAgo) && date.isBefore(now);
      }
      if (v === "近一年") {
        isPass = date.isAfter(oneYearAgo) && date.isBefore(now);
      }
      return isPass;
    });
  };

  const handlefeishuData = (data = [], type = "") => {
    // allData有值就是初始化时全选，没值就是正常逻辑选择时
    let _selectedProjTags = type === "proj" ? data : selectedProjTags;
    let _selectedCustTags = type === "cust" ? data : selectedCustTags;
    let _selectedRangeTags = type === "range" ? data : selectedRangeTags;
    let _selectedStatusTags = type === "status" ? data : selectedStatusTags;
    let _selectedOnlyOneTags = type === "onlyOne" ? data : selectedOnlyOneTags;
    let _selectedEndDateTags = type === "endDate" ? data : selectedEndDateTags;
    //   签约项目 对方签约公司 [] 发行范围 []
    const _currentFeishuData = feishuDataRef.current
      .filter((v) => !!v?.fields?.["签约项目"])
      .map((v) => ({
        ...v,
        fields: {
          ...v.fields,
          对方签约公司: v.fields?.["对方签约公司"] || [],
          发行范围: v.fields?.["发行范围"] || [],
        },
      }))
      .filter(
        (v) =>
          // 项目 // 没选择=全选中，不算查询条件
          (_selectedProjTags.length === 0 ||
            _selectedProjTags.includes(v?.fields?.["签约项目"])) &&
          // 客户// 没选择=全选中，不算查询条件
          (_selectedCustTags.length === 0 ||
            v?.fields?.["对方签约公司"]?.some?.((value) =>
              _selectedCustTags.includes(value)
            ) ||
            (v?.fields?.["对方签约公司"].length === 0 &&
              _selectedCustTags.length === 0)) &&
          // 范围// 没选择=全选中，不算查询条件
          (_selectedRangeTags.length === 0 ||
            v?.fields?.["发行范围"]?.some?.((value) =>
              _selectedRangeTags.includes(value)
            ) ||
            (v?.fields?.["发行范围"].length === 0 &&
              _selectedRangeTags.length === 0)) &&
          // 状态
          (_selectedStatusTags.length === 0 ||
            _selectedStatusTags.includes(v?.fields?.["项目状态"])) &&
          // 独家
          (_selectedOnlyOneTags.length === 0 ||
            _selectedOnlyOneTags.includes(v?.fields?.["是否独家签约"])) &&
          // 到期时间
          (_selectedEndDateTags.length === 0 ||
            verifyTime(_selectedEndDateTags, v?.fields?.["到期时间"]))
      );
    setCurrentFeishuData(_currentFeishuData);
  };
  const handleChange = (tag, checked, type) => {
    if (type === "proj") {
      const nextSelectedTags = checked
        ? [...selectedProjTags, tag]
        : selectedProjTags.filter((t) => t !== tag);
      setSelectedProjTags(nextSelectedTags);
      handlefeishuData(nextSelectedTags, "proj");
    }
    if (type === "cust") {
      const nextSelectedTags = checked
        ? [...selectedCustTags, tag]
        : selectedCustTags.filter((t) => t !== tag);
      setSelectedCustTags(nextSelectedTags);
      handlefeishuData(nextSelectedTags, "cust");
    }

    if (type === "range") {
      const nextSelectedTags = checked
        ? [...selectedRangeTags, tag]
        : selectedRangeTags.filter((t) => t !== tag);
      setSelectedRangeTags(nextSelectedTags);
      handlefeishuData(nextSelectedTags, "range");
    }
    if (type === "status") {
      const nextSelectedTags = checked
        ? [...selectedStatusTags, tag]
        : selectedStatusTags.filter((t) => t !== tag);
      setSelectedStatusTags(nextSelectedTags);
      handlefeishuData(nextSelectedTags, "status");
    }
    if (type === "onlyOne") {
      const nextSelectedTags = checked
        ? [...selectedOnlyOneTags, tag]
        : selectedOnlyOneTags.filter((t) => t !== tag);
      setSelectedOnlyOneTags(nextSelectedTags);
      handlefeishuData(nextSelectedTags, "onlyOne");
    }
    if (type === "endDate") {
      const nextSelectedTags = checked
        ? [...selectedEndDateTags, tag]
        : selectedEndDateTags.filter((t) => t !== tag);
      setSelectedEndDateTags(nextSelectedTags);
      handlefeishuData(nextSelectedTags, "endDate");
    }
  };
  const onClickonDrawerOpen = (index) => {
    const _isDrawerOpens = [...isDrawerOpens];
    _isDrawerOpens[index] = !_isDrawerOpens[index];
    setIsDrawerOpens(_isDrawerOpens);
    console.log(isDrawerOpens);
  };

  return (
    <div className="page">
      <div id="message" className="message">
        <span>{mousemSelectedData}</span>
      </div>
      <div
        className="area title"
        style={
          isMobileDevice
            ? {
                top: "12px",
                fontSize: "15px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "auto",
                padding: "8px 16px",
              }
            : {}
        }
      >
        <img src={lemonIcon} alt="" />
        柠萌海外发行情况
      </div>
      <div
        className="left"
        style={{ height: isDrawerOpens[0] ? "calc(100% - 44px)" : "16px" }}
      >
        <span className="title">
          <span style={{ display: isDrawerOpens[0] ? "inline-block" : "none" }}>
            <img src={lemonIcon} alt="" />
            筛选条件
          </span>
          <span className="drawer_icon" onClick={() => onClickonDrawerOpen(0)}>
            {isDrawerOpens[0] ? (
              <MenuFoldOutlined width={"10px"} />
            ) : (
              <MenuUnfoldOutlined width={10} />
            )}
          </span>
        </span>
        <div
          className="cards"
          style={{
            display: isDrawerOpens[0] ? "block" : "none",
            width: "200px",
          }}
        >
          <Card title="项目">
            {projectsData.map((item) => (
              <Tag.CheckableTag
                key={item}
                checked={selectedProjTags.includes(item)}
                onChange={(checked) => handleChange(item, checked, "proj")}
                color="red"
              >
                {item}
              </Tag.CheckableTag>
            ))}
          </Card>
          <Card title="客户">
            {customnersData.map((item) => (
              <Tag.CheckableTag
                key={item}
                checked={selectedCustTags.includes(item)}
                onChange={(checked) => handleChange(item, checked, "cust")}
                color="red"
              >
                {item}
              </Tag.CheckableTag>
            ))}
          </Card>
          <Card title="项目状态">
            {statusData.map((item) => (
              <Tag.CheckableTag
                key={item}
                checked={selectedStatusTags.includes(item)}
                onChange={(checked) => handleChange(item, checked, "status")}
                color="red"
              >
                {item}
              </Tag.CheckableTag>
            ))}
          </Card>
          <Card title="发行范围">
            {publishData.map((item) => (
              <Tag.CheckableTag
                key={item}
                checked={selectedRangeTags.includes(item)}
                onChange={(checked) => handleChange(item, checked, "range")}
                color="red"
              >
                {item}
              </Tag.CheckableTag>
            ))}
          </Card>
          <Card title="是否独家签约">
            {onlyOneData.map((item) => (
              <Tag.CheckableTag
                key={item}
                checked={selectedOnlyOneTags.includes(item)}
                onChange={(checked) => handleChange(item, checked, "onlyOne")}
                color="red"
              >
                {item}
              </Tag.CheckableTag>
            ))}
          </Card>
          <Card title="签约到期时间">
            {endDateData.map((item) => (
              <Tag.CheckableTag
                key={item}
                checked={selectedEndDateTags.includes(item)}
                onChange={(checked) => handleChange(item, checked, "endDate")}
                color="red"
              >
                {item}
              </Tag.CheckableTag>
            ))}
          </Card>
        </div>
      </div>
      <div id="allmap" className="map"></div>
      <div className="right">
        <div className="top">
          <p className="title">
            <span
              style={{ display: isDrawerOpens[1] ? "inline-block" : "none" }}
            >
              <img src={lemonIcon} alt="" />
              公司合作情况
            </span>
            <span
              className="drawer_icon"
              onClick={() => onClickonDrawerOpen(1)}
            >
              {isDrawerOpens[1] ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
          </p>
          <div
            id="chartContainer"
            style={{
              width: "410px",
              height: "320px",
              display: isDrawerOpens[1] ? "block" : "none",
            }}
          />
        </div>
        <div
          className="bottom"
          style={{
            display: isDrawerOpens[1] ? "block" : "none",
          }}
        >
          <p className="title">
            <img src={lemonIcon} alt="" />
            列表数据
          </p>
          <Table
            columns={columns}
            dataSource={dataSource}
            size="small"
            rowKey={"name"}
            pagination={false}
          />
        </div>
      </div>
    </div>
  );
};

// const MemoPage = React.memo(Page);

export default Page;
